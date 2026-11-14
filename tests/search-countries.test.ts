import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { HttpError, searchCountries } from '../src/search-countries';

const countries = [{ name: 'Spain' }];

describe('searchCountries', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('requests the encoded query and passes the abort signal', async () => {
        const signal = new AbortController().signal;
        const fetchMock = jest
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(new Response(JSON.stringify(countries), { status: 200 }));

        await expect(searchCountries('South Korea', signal)).resolves.toEqual(countries);
        expect(fetchMock).toHaveBeenCalledWith('https://countries.dev/name/South%20Korea', { signal });
    });

    test('returns an empty array when the API responds with 404', async () => {
        jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

        await expect(searchCountries('No such country', new AbortController().signal)).resolves.toEqual([]);
    });

    test('throws HttpError for other unsuccessful responses', async () => {
        jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }));

        await expect(searchCountries('Spain', new AbortController().signal)).rejects.toMatchObject({
            name: 'HttpError',
            status: 503,
        });
        await expect(searchCountries('Spain', new AbortController().signal)).rejects.toBeInstanceOf(HttpError);
    });
});
