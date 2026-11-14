import { describe, expect, test } from '@jest/globals';
import { createTimedSignal } from '../src/search-signal';

describe('createTimedSignal', () => {
    test('preserves caller cancellation', async () => {
        const controller = new AbortController();
        const signal = createTimedSignal(controller.signal, 1000);
        const reason = new DOMException('Request was cancelled', 'AbortError');
        const aborted = new Promise<unknown>((resolve) => {
            signal.addEventListener('abort', () => resolve(signal.reason), { once: true });
        });

        controller.abort(reason);

        await expect(aborted).resolves.toBe(reason);
    });

    test('aborts with a TimeoutError when the timeout expires', async () => {
        const signal = createTimedSignal(new AbortController().signal, 10);
        const reason = new Promise<unknown>((resolve) => {
            signal.addEventListener('abort', () => resolve(signal.reason), { once: true });
        });

        await expect(reason).resolves.toMatchObject({ name: 'TimeoutError' });
    });
});
