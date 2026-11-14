import { HttpError } from './search-countries.js';

export type SearchErrorKind = 'aborted' | 'timeout' | 'http' | 'network';

export function classifySearchError(error: unknown): SearchErrorKind {
    if (typeof error === 'object' && error !== null && 'name' in error) {
        if (error.name === 'AbortError') {
            return 'aborted';
        }

        if (error.name === 'TimeoutError') {
            return 'timeout';
        }
    }

    return error instanceof HttpError ? 'http' : 'network';
}
