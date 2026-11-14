import { describe, expect, test } from '@jest/globals';
import { HttpError } from '../src/search-countries';
import { classifySearchError } from '../src/search-error';

describe('classifySearchError', () => {
    test('recognizes user cancellation separately from timeouts', () => {
        const abortError = new DOMException('Request was cancelled', 'AbortError');
        const timeoutError = new DOMException('Request timed out', 'TimeoutError');

        expect(classifySearchError(abortError)).toBe('aborted');
        expect(classifySearchError(timeoutError)).toBe('timeout');
    });

    test('recognizes HTTP and network errors', () => {
        expect(classifySearchError(new HttpError(503))).toBe('http');
        expect(classifySearchError(new TypeError('Network unavailable'))).toBe('network');
    });
});
