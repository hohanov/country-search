import { HttpError } from './search-countries.js';
export function classifySearchError(error) {
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
//# sourceMappingURL=search-error.js.map