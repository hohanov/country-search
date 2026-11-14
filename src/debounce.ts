export type DebouncedFunction<Arguments extends unknown[]> = ((...args: Arguments) => void) & {
    cancel: () => void;
};

export function debounce<Arguments extends unknown[]>(
    callback: (...args: Arguments) => void,
    delay: number
): DebouncedFunction<Arguments> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const debounced = (...args: Arguments): void => {
        if (timer !== undefined) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            timer = undefined;
            callback(...args);
        }, delay);
    };

    debounced.cancel = (): void => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    };

    return debounced;
}
