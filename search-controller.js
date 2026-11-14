import { debounce } from './debounce.js';
import { CountrySearchService } from './country-search-service.js';
import { mapCountryResponse } from './map-country-response.js';
import { classifySearchError } from './search-error.js';
export class SearchController {
    constructor(onStateChange, debounceDelay = 300, timeoutMs = 10000, onSearch) {
        this.onStateChange = onStateChange;
        this.onSearch = onSearch;
        this.query = '';
        this.activeController = null;
        this.searchService = new CountrySearchService(timeoutMs);
        this.debouncedSearch = debounce((query) => {
            void this.executeSearch(query);
        }, debounceDelay);
    }
    setQuery(query) {
        this.query = query.trim();
        this.cancelPendingSearch();
        if (this.query.length === 0) {
            this.onStateChange({ status: 'idle' });
            return;
        }
        this.onStateChange({ status: 'loading', query: this.query });
        this.debouncedSearch(this.query);
    }
    searchQuery(query) {
        this.query = query.trim();
        this.cancelPendingSearch();
        this.searchNow();
    }
    searchNow() {
        this.debouncedSearch.cancel();
        this.abortActiveSearch();
        if (this.query.length === 0) {
            this.onStateChange({ status: 'idle' });
            return;
        }
        this.onStateChange({ status: 'loading', query: this.query });
        void this.executeSearch(this.query);
    }
    retry() {
        this.searchNow();
    }
    dispose() {
        this.cancelPendingSearch();
    }
    cancelPendingSearch() {
        this.debouncedSearch.cancel();
        this.abortActiveSearch();
    }
    abortActiveSearch() {
        this.activeController?.abort();
        this.activeController = null;
    }
    isCurrentSearch(query, controller) {
        return this.query === query && this.activeController === controller && !controller.signal.aborted;
    }
    async executeSearch(query) {
        const controller = new AbortController();
        this.activeController = controller;
        try {
            this.onSearch?.(query);
            const response = await this.searchService.search(query, controller.signal);
            if (!this.isCurrentSearch(query, controller)) {
                return;
            }
            const countries = response.map(mapCountryResponse);
            this.activeController = null;
            this.onStateChange(countries.length > 0 ? { status: 'results', query, countries } : { status: 'empty', query });
        }
        catch (error) {
            if (!this.isCurrentSearch(query, controller)) {
                return;
            }
            const kind = classifySearchError(error);
            if (kind === 'aborted') {
                return;
            }
            this.activeController = null;
            this.onStateChange({
                status: 'error',
                query,
                message: kind === 'timeout'
                    ? 'Поиск занял слишком много времени. Попробуйте ещё раз.'
                    : 'Не удалось загрузить страны. Проверьте соединение и попробуйте ещё раз.',
            });
        }
    }
}
//# sourceMappingURL=search-controller.js.map