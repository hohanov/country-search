export function createTimedSignal(signal, timeoutMs) {
    return AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
}
//# sourceMappingURL=search-signal.js.map