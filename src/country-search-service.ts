import { searchCountries, type CountryApiResponse } from './search-countries.js';
import { createTimedSignal } from './search-signal.js';

interface SharedSearchRequest {
    promise: Promise<CountryApiResponse[]>;
    controller: AbortController;
    consumers: number;
}

export class CountrySearchService {
    private readonly cache = new Map<string, CountryApiResponse[]>();
    private readonly inFlight = new Map<string, SharedSearchRequest>();

    constructor(private readonly timeoutMs = 10000) {}

    search(query: string, signal: AbortSignal): Promise<CountryApiResponse[]> {
        if (signal.aborted) {
            return Promise.reject(signal.reason);
        }

        const cached = this.cache.get(query);
        if (cached !== undefined) {
            return this.withCallerSignal(Promise.resolve(cached), signal, () => {});
        }

        let sharedRequest = this.inFlight.get(query);
        if (sharedRequest === undefined) {
            const requestController = new AbortController();
            const requestSignal = createTimedSignal(requestController.signal, this.timeoutMs);
            const promise = searchCountries(query, requestSignal).then((countries) => {
                if (!requestSignal.aborted) {
                    this.cache.set(query, countries);
                }
                return countries;
            });
            const createdRequest = { promise, controller: requestController, consumers: 0 };
            sharedRequest = createdRequest;
            this.inFlight.set(query, createdRequest);
            void promise.then(
                () => this.removeRequest(query, createdRequest),
                () => this.removeRequest(query, createdRequest)
            );
        }

        sharedRequest.consumers += 1;
        return this.withCallerSignal(sharedRequest.promise, signal, () => {
            sharedRequest.consumers -= 1;
            if (sharedRequest.consumers === 0 && this.inFlight.get(query) === sharedRequest) {
                sharedRequest.controller.abort();
            }
        });
    }

    private removeRequest(query: string, request: SharedSearchRequest): void {
        if (this.inFlight.get(query) === request) {
            this.inFlight.delete(query);
        }
    }

    private withCallerSignal(
        request: Promise<CountryApiResponse[]>,
        signal: AbortSignal,
        release: () => void
    ): Promise<CountryApiResponse[]> {
        return new Promise((resolve, reject) => {
            let settled = false;
            const cleanup = (): void => {
                signal.removeEventListener('abort', handleAbort);
                if (!settled) {
                    settled = true;
                    release();
                }
            };
            const handleAbort = (): void => {
                cleanup();
                reject(signal.reason);
            };

            if (signal.aborted) {
                handleAbort();
                return;
            }

            signal.addEventListener('abort', handleAbort, { once: true });
            request.then(
                (countries) => {
                    cleanup();
                    resolve(countries);
                },
                (error: unknown) => {
                    cleanup();
                    reject(error);
                }
            );
        });
    }
}
