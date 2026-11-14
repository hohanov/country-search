function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readString(value) {
    return typeof value === 'string' ? value : '';
}
function readNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
function readLanguages(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((language) => typeof language === 'string' ? language : isRecord(language) ? readString(language.name) : '')
        .filter((language) => language.length > 0);
}
function readBorders(value) {
    return Array.isArray(value) ? value.filter((border) => typeof border === 'string') : [];
}
function readCurrencies(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.flatMap((currency) => {
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
export function mapCountryResponse(raw) {
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
//# sourceMappingURL=map-country-response.js.map