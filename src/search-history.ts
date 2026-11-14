export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export class SearchHistory {
    private queries: string[];

    constructor(
        private readonly storage: StorageLike,
        private readonly storageKey = 'country-search-history',
        private readonly limit = 10
    ) {
        this.queries = this.read();
    }

    getAll(): string[] {
        return [...this.queries];
    }

    add(query: string): void {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length === 0) {
            return;
        }

        this.queries = [normalizedQuery, ...this.queries.filter((item) => item !== normalizedQuery)].slice(
            0,
            this.limit
        );
        this.storage.setItem(this.storageKey, JSON.stringify(this.queries));
    }

    remove(query: string): void {
        const normalizedQuery = query.trim();
        const updatedQueries = this.queries.filter((item) => item !== normalizedQuery);
        if (updatedQueries.length === this.queries.length) {
            return;
        }

        this.queries = updatedQueries;
        this.storage.setItem(this.storageKey, JSON.stringify(this.queries));
    }

    private read(): string[] {
        const saved = this.storage.getItem(this.storageKey);
        if (saved === null) {
            return [];
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(saved);
        } catch {
            return [];
        }

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter((query): query is string => typeof query === 'string')
            .map((query) => query.trim())
            .filter((query, index, queries) => query.length > 0 && queries.indexOf(query) === index)
            .slice(0, this.limit);
    }
}
