import { describe, expect, test } from '@jest/globals';
import { SearchHistory, type StorageLike } from '../src/search-history';

class MemoryStorage implements StorageLike {
    private readonly values = new Map<string, string>();

    getItem(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    setItem(key: string, value: string): void {
        this.values.set(key, value);
    }
}

describe('SearchHistory', () => {
    test('persists recent unique queries and returns newest first', () => {
        const storage = new MemoryStorage();
        const history = new SearchHistory(storage, 'country-search-history', 3);

        history.add('Spain');
        history.add('France');
        history.add('Japan');
        history.add('Spain');

        expect(history.getAll()).toEqual(['Spain', 'Japan', 'France']);
        expect(JSON.parse(storage.getItem('country-search-history') ?? '[]')).toEqual(['Spain', 'Japan', 'France']);
    });

    test('loads saved history and ignores invalid stored data', () => {
        const storage = new MemoryStorage();
        storage.setItem('saved', '["Canada","Mexico"]');
        expect(new SearchHistory(storage, 'saved').getAll()).toEqual(['Canada', 'Mexico']);

        storage.setItem('invalid', '{not json');
        expect(new SearchHistory(storage, 'invalid').getAll()).toEqual([]);
    });

    test('removes only the specified recent query and persists the change', () => {
        const storage = new MemoryStorage();
        const history = new SearchHistory(storage, 'saved');
        history.add('r');
        history.add('ru');
        history.add('rus');

        history.remove('ru');

        expect(history.getAll()).toEqual(['rus', 'r']);
        expect(JSON.parse(storage.getItem('saved') ?? '[]')).toEqual(['rus', 'r']);
    });
});
