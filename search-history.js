export class SearchHistory {
    constructor(storage, storageKey = 'country-search-history', limit = 10) {
        this.storage = storage;
        this.storageKey = storageKey;
        this.limit = limit;
        this.queries = this.read();
    }
    getAll() {
        return [...this.queries];
    }
    add(query) {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length === 0) {
            return;
        }
        this.queries = [normalizedQuery, ...this.queries.filter((item) => item !== normalizedQuery)].slice(0, this.limit);
        this.storage.setItem(this.storageKey, JSON.stringify(this.queries));
    }
    remove(query) {
        const normalizedQuery = query.trim();
        const updatedQueries = this.queries.filter((item) => item !== normalizedQuery);
        if (updatedQueries.length === this.queries.length) {
            return;
        }
        this.queries = updatedQueries;
        this.storage.setItem(this.storageKey, JSON.stringify(this.queries));
    }
    read() {
        const saved = this.storage.getItem(this.storageKey);
        if (saved === null) {
            return [];
        }
        let parsed;
        try {
            parsed = JSON.parse(saved);
        }
        catch {
            return [];
        }
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter((query) => typeof query === 'string')
            .map((query) => query.trim())
            .filter((query, index, queries) => query.length > 0 && queries.indexOf(query) === index)
            .slice(0, this.limit);
    }
}
//# sourceMappingURL=search-history.js.map