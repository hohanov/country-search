export interface CountryDetails {
    name: string;
    flag: string;
    capital: string;
    region: string;
    population: number;
    languages: string[];
    area: number;
    borders: string[];
    currencies: CurrencyDetails[];
}

export interface CurrencyDetails {
    name: string;
    code?: string;
    symbol?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readLanguages(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((language) =>
            typeof language === 'string' ? language : isRecord(language) ? readString(language.name) : ''
        )
        .filter((language) => language.length > 0);
}

function readBorders(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((border): border is string => typeof border === 'string') : [];
}

function readCurrencies(value: unknown): CurrencyDetails[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((currency): CurrencyDetails[] => {
        if (!isRecord(currency) || typeof currency.name !== 'string') {
            return [];
        }

        return [
            {
                name: currency.name,
                ...(typeof currency.code === 'string' ? { code: currency.code } : {}),
                ...(typeof currency.symbol === 'string' ? { symbol: currency.symbol } : {}),
            },
        ];
    });
}

export function mapCountryResponse(raw: unknown): CountryDetails {
    const country = isRecord(raw) ? raw : {};
    const flags = isRecord(country.flags) ? country.flags : {};

    return {
        name: readString(country.name),
        flag: readString(flags.svg) || readString(flags.png) || readString(country.flag),
        capital: readString(country.capital),
        region: readString(country.region),
        population: readNumber(country.population),
        languages: readLanguages(country.languages),
        area: readNumber(country.area),
        borders: readBorders(country.borders),
        currencies: readCurrencies(country.currencies),
    };
}
