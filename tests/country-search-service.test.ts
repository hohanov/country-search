import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { CountrySearchService } from '../src/country-search-service';

describe('CountrySearchService', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('caches successful results and reuses them for repeated queries', async () => {
        const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify([{ name: 'Spain' }]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );
        const service = new CountrySearchService(5000);

        await expect(service.search('Spain', new AbortController().signal)).resolves.toMatchObject([{ name: 'Spain' }]);
        await expect(service.search('Spain', new AbortController().signal)).resolves.toMatchObject([{ name: 'Spain' }]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('deduplicates in-flight queries without coupling caller cancellation', async () => {
        let resolveResponse: ((response: Response) => void) | undefined;
        const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(
            () =>
                new Promise<Response>((resolve) => {
                    resolveResponse = resolve;
                })
        );
        const service = new CountrySearchService(5000);
        const firstCaller = new AbortController();
        const secondCaller = new AbortController();
        const firstRequest = service.search('Spain', firstCaller.signal);
        const secondRequest = service.search('Spain', secondCaller.signal);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        firstCaller.abort();
        await expect(firstRequest).rejects.toMatchObject({ name: 'AbortError' });

        resolveResponse?.(
            new Response(JSON.stringify([{ name: 'Spain' }]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );
        await expect(secondRequest).resolves.toMatchObject([{ name: 'Spain' }]);
        await expect(service.search('Spain', new AbortController().signal)).resolves.toMatchObject([{ name: 'Spain' }]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
