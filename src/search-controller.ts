import { debounce, type DebouncedFunction } from './debounce.js';
import { CountrySearchService } from './country-search-service.js';
import { mapCountryResponse, type CountryDetails } from './map-country-response.js';
import { classifySearchError } from './search-error.js';

export type SearchState =
    | { status: 'idle' }
    | { status: 'loading'; query: string }
    | { status: 'empty'; query: string }
    | { status: 'results'; query: string; countries: CountryDetails[] }
    | { status: 'error'; query: string; message: string };

export class SearchController {
    private query = '';
    private activeController: AbortController | null = null;
    private readonly debouncedSearch: DebouncedFunction<[string]>;
    private readonly searchService: CountrySearchService;

    constructor(
        private readonly onStateChange: (state: SearchState) => void,
        debounceDelay = 300,
        timeoutMs = 10000,
        private readonly onSearch?: (query: string) => void
    ) {
        this.searchService = new CountrySearchService(timeoutMs);
        this.debouncedSearch = debounce((query: string) => {
            void this.executeSearch(query);
        }, debounceDelay);
    }

    setQuery(query: string): void {
        this.query = query.trim();
        this.cancelPendingSearch();

        if (this.query.length === 0) {
            this.onStateChange({ status: 'idle' });
            return;
        }

        this.onStateChange({ status: 'loading', query: this.query });
        this.debouncedSearch(this.query);
    }

    searchQuery(query: string): void {
        this.query = query.trim();
        this.cancelPendingSearch();
        this.searchNow();
    }

    searchNow(): void {
        this.debouncedSearch.cancel();
        this.abortActiveSearch();

        if (this.query.length === 0) {
            this.onStateChange({ status: 'idle' });
            return;
        }

        this.onStateChange({ status: 'loading', query: this.query });
        void this.executeSearch(this.query);
    }

    retry(): void {
        this.searchNow();
    }

    dispose(): void {
        this.cancelPendingSearch();
    }

    private cancelPendingSearch(): void {
        this.debouncedSearch.cancel();
        this.abortActiveSearch();
    }

    private abortActiveSearch(): void {
        this.activeController?.abort();
        this.activeController = null;
    }

    private isCurrentSearch(query: string, controller: AbortController): boolean {
        return this.query === query && this.activeController === controller && !controller.signal.aborted;
    }

    private async executeSearch(query: string): Promise<void> {
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
            this.onStateChange(
                countries.length > 0 ? { status: 'results', query, countries } : { status: 'empty', query }
            );
        } catch (error) {
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
                message:
                    kind === 'timeout'
                        ? 'Поиск занял слишком много времени. Попробуйте ещё раз.'
                        : 'Не удалось загрузить страны. Проверьте соединение и попробуйте ещё раз.',
            });
        }
    }
}
