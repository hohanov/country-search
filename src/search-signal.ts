export function createTimedSignal(signal: AbortSignal, timeoutMs: number): AbortSignal {
    return AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
}
