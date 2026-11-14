export function debounce(callback, delay) {
    let timer;
    const debounced = (...args) => {
        if (timer !== undefined) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            timer = undefined;
            callback(...args);
        }, delay);
    };
    debounced.cancel = () => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    };
    return debounced;
}
//# sourceMappingURL=debounce.js.map