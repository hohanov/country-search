import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { debounce } from '../src/debounce';

describe('debounce', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('calls the function after the delay', () => {
        const callback = jest.fn();
        const debounced = debounce(callback, 250);

        debounced('query');

        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(249);
        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('query');
    });

    test('resets the delay and uses the latest arguments when called again', () => {
        const callback = jest.fn();
        const debounced = debounce(callback, 250);

        debounced('old query');
        jest.advanceTimersByTime(200);
        debounced('latest query');
        jest.advanceTimersByTime(249);

        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('latest query');
    });
});
