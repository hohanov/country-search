import { describe, expect, test } from '@jest/globals';
import { mapCountryResponse } from '../src/map-country-response';

describe('mapCountryResponse', () => {
    test('maps API values for a country card and details', () => {
        const raw = Object.freeze({
            name: 'Spain',
            flag: '🇪🇸',
            flags: Object.freeze({ svg: 'https://example.test/spain.svg' }),
            capital: 'Madrid',
            region: 'Europe',
            population: 47351567,
            languages: Object.freeze([Object.freeze({ name: 'Spanish' })]),
            area: 505990,
            borders: Object.freeze(['Andorra', 'France', 'Portugal']),
            currencies: Object.freeze([Object.freeze({ name: 'Euro', code: 'EUR', symbol: '€' })]),
        });

        expect(mapCountryResponse(raw)).toEqual({
            name: 'Spain',
            flag: 'https://example.test/spain.svg',
            capital: 'Madrid',
            region: 'Europe',
            population: 47351567,
            languages: ['Spanish'],
            area: 505990,
            borders: ['Andorra', 'France', 'Portugal'],
            currencies: [{ name: 'Euro', code: 'EUR', symbol: '€' }],
        });
        expect(raw.name).toBe('Spain');
    });

    test('uses safe defaults for optional country data', () => {
        expect(mapCountryResponse({ name: 'Narnia' })).toEqual({
            name: 'Narnia',
            flag: '',
            capital: '',
            region: '',
            population: 0,
            languages: [],
            area: 0,
            borders: [],
            currencies: [],
        });
    });
});
