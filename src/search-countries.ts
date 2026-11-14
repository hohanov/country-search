export interface CountryApiResponse {
    name: string;
    [key: string]: unknown;
}

export class HttpError extends Error {
    constructor(public readonly status: number) {
        super(`Country search failed with HTTP status ${status}`);
        this.name = 'HttpError';
    }
}

function isCountryApiResponse(value: unknown): value is CountryApiResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        'name' in value &&
        typeof value.name === 'string'
    );
}

export async function searchCountries(query: string, signal: AbortSignal): Promise<CountryApiResponse[]> {
    const response = await fetch(`https://countries.dev/name/${encodeURIComponent(query)}`, { signal });

    if (response.status === 404) {
        return [];
    }

    if (!response.ok) {
        throw new HttpError(response.status);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data) || !data.every(isCountryApiResponse)) {
        throw new TypeError('Country search returned an invalid response');
    }

    return data;
}
