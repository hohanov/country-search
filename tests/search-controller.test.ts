import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { SearchController, type SearchState } from '../src/search-controller';

function createAbortAwareFetch() {
    const requests: Array<{ query: string; signal: AbortSignal; resolve: (response: Response) => void }> = [];
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = new URL(String(input));
        const pathParts = url.pathname.split('/');
        let resolveResponse: ((response: Response) => void) | undefined;
        const request = {
            query: decodeURIComponent(pathParts[pathParts.length - 1] ?? ''),
            signal: init?.signal as AbortSignal,
            resolve: (response: Response): void => resolveResponse?.(response),
        };

        const promise = new Promise<Response>((resolve, reject) => {
            resolveResponse = resolve;
            request.signal.addEventListener(
                'abort',
                () => reject(new DOMException('Request was cancelled', 'AbortError')),
                { once: true }
            );
            if (request.signal.aborted) {
                reject(new DOMException('Request was cancelled', 'AbortError'));
            }
        });

        requests.push(request);
        return promise;
    });

    return { fetchMock, requests };
}

describe('SearchController request races', () => {
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test('aborts the previous request immediately and only publishes the latest result', async () => {
        jest.useFakeTimers();
        const states: SearchState[] = [];
        const controller = new SearchController((state) => states.push(state), 100, 5000);
        const { requests } = createAbortAwareFetch();

        controller.setQuery('sp');
        jest.advanceTimersByTime(100);
        expect(requests).toHaveLength(1);
        expect(requests[0].query).toBe('sp');

        controller.setQuery('spain');
        expect(requests[0].signal.aborted).toBe(true);
        jest.advanceTimersByTime(100);
        expect(requests).toHaveLength(2);
        expect(requests[1].query).toBe('spain');

        requests[1].resolve(
            new Response(JSON.stringify([{ name: 'Spain', capital: 'Madrid' }]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );
        for (let i = 0; i < 10 && states[states.length - 1].status !== 'results'; i += 1) {
            await Promise.resolve();
        }

        expect(states[states.length - 1]).toMatchObject({
            status: 'results',
            countries: [{ name: 'Spain', capital: 'Madrid' }],
        });
        expect(states.some((state) => state.status === 'error')).toBe(false);
    });

    test('does not send a request after the input is cleared during debounce', () => {
        jest.useFakeTimers();
        const states: SearchState[] = [];
        const controller = new SearchController((state) => states.push(state), 100, 5000);
        const fetchMock = jest.spyOn(globalThis, 'fetch');

        controller.setQuery('sp');
        controller.setQuery('');
        jest.advanceTimersByTime(100);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(states[states.length - 1]).toEqual({ status: 'idle' });
    });
});
