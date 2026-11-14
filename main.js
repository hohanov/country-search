import { SearchController } from './search-controller.js';
import { SearchHistory } from './search-history.js';
document.body.classList.add('overflow-y-scroll');
function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}
function createCountryCard(country, onSelect) {
    const button = createElement('button', 'card country-card h-100 text-start border-0 shadow');
    button.type = 'button';
    button.setAttribute('aria-label', `Подробнее о стране: ${country.name}`);
    button.addEventListener('click', onSelect);
    const body = createElement('span', 'card-body d-flex align-items-start gap-3');
    if (country.flag.startsWith('http')) {
        const flag = createElement('img', 'country-flag rounded');
        flag.src = country.flag;
        flag.alt = `Флаг ${country.name}`;
        flag.loading = 'lazy';
        body.append(flag);
    }
    else {
        body.append(createElement('span', 'country-flag fs-2', country.flag || '🏳️'));
    }
    const content = createElement('span', 'country-card-content d-block');
    content.append(createElement('span', 'd-block fw-semibold fs-5 mb-2', country.name), createElement('span', 'd-block text-body-secondary', `Столица: ${country.capital || '—'}`), createElement('span', 'd-block text-body-secondary', `Регион: ${country.region || '—'}`), createElement('span', 'd-block text-body-secondary', `Население: ${country.population.toLocaleString('ru-RU')}`));
    body.append(content);
    button.append(body);
    return button;
}
function renderDetails(container, country) {
    container.replaceChildren();
    const section = createElement('section', 'card mt-4 shadow');
    section.setAttribute('aria-labelledby', 'country-details-title');
    const body = createElement('div', 'card-body');
    const heading = createElement('div', 'd-flex justify-content-between align-items-start gap-3');
    const title = createElement('h2', 'h4 card-title', country.name);
    title.id = 'country-details-title';
    const closeButton = createElement('button', 'btn btn-outline-secondary btn-sm', 'Закрыть');
    closeButton.type = 'button';
    closeButton.addEventListener('click', () => container.replaceChildren());
    heading.append(title, closeButton);
    const list = createElement('dl', 'row mb-0');
    const values = [
        ['Площадь', country.area ? `${country.area.toLocaleString('ru-RU')} км²` : '—'],
        ['Граничит с', country.borders.join(', ') || '—'],
        ['Языки', country.languages.join(', ') || '—'],
        [
            'Валюта',
            country.currencies
                .map((currency) => `${currency.name}${currency.code ? ` (${currency.code})` : ''}`)
                .join(', ') || '—',
        ],
    ];
    for (const [label, value] of values) {
        list.append(createElement('dt', 'col-sm-3', label), createElement('dd', 'col-sm-9', value));
    }
    body.append(heading, list);
    section.append(body);
    container.append(section);
}
function renderState(container, detailsContainer, state, controller) {
    container.replaceChildren();
    detailsContainer.replaceChildren();
    if (state.status === 'idle') {
        container.append(createElement('p', 'text-body-secondary text-center py-4', 'Введите название страны для поиска.'));
        return;
    }
    if (state.status === 'loading') {
        const status = createElement('div', 'd-flex justify-content-center align-items-center gap-2 py-5');
        status.setAttribute('role', 'status');
        status.append(createElement('span', 'spinner-border spinner-border-sm text-primary'));
        status.append(createElement('span', 'text-body-secondary', 'Ищем страны…'));
        container.append(status);
        return;
    }
    if (state.status === 'empty') {
        container.append(createElement('p', 'alert alert-light text-center mt-4', 'Ничего не найдено. Попробуйте другой запрос.'));
        return;
    }
    if (state.status === 'error') {
        const alert = createElement('div', 'alert alert-danger mt-4');
        alert.setAttribute('role', 'alert');
        alert.append(createElement('p', 'mb-3', state.message));
        const retryButton = createElement('button', 'btn btn-outline-danger', 'Повторить');
        retryButton.type = 'button';
        retryButton.addEventListener('click', () => controller.retry());
        alert.append(retryButton);
        container.append(alert);
        return;
    }
    const grid = createElement('div', 'row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mt-1');
    for (const country of state.countries) {
        const column = createElement('div', 'col');
        column.append(createCountryCard(country, () => renderDetails(detailsContainer, country)));
        grid.append(column);
    }
    container.append(grid);
}
function renderHistory(container, queries, onSelect) {
    container.replaceChildren();
    if (queries.length === 0) {
        return;
    }
    container.append(createElement('h2', 'h6 text-body-secondary mb-2', 'Недавние запросы'));
    const list = createElement('div', 'd-flex flex-wrap justify-content-center gap-2');
    for (const query of queries) {
        const button = createElement('button', 'btn btn-sm btn-outline-secondary', query);
        button.type = 'button';
        button.addEventListener('click', () => onSelect(query));
        list.append(button);
    }
    container.append(list);
}
const app = createElement('main', 'container py-5');
const header = createElement('header', 'text-center mb-4');
header.append(createElement('h1', 'display-5 fw-semibold', 'Поиск стран'), createElement('p', 'lead text-body-secondary', 'Найдите страну по названию'));
const form = createElement('form', 'row g-2 justify-content-center');
form.setAttribute('role', 'search');
const inputColumn = createElement('div', 'col-12 col-md-8 col-lg-6');
const input = createElement('input', 'form-control form-control-lg');
input.type = 'search';
input.name = 'country';
input.placeholder = 'Например, Spain';
input.autocomplete = 'off';
input.setAttribute('aria-label', 'Название страны');
inputColumn.append(input);
form.append(inputColumn);
header.append(form);
const results = createElement('section', 'mt-4');
results.setAttribute('aria-live', 'polite');
const historyContainer = createElement('section', 'mt-4');
historyContainer.setAttribute('aria-label', 'История поиска');
const details = createElement('div', '');
app.append(header, historyContainer, results, details);
document.body.append(app);
const history = new SearchHistory(window.localStorage);
let previousInputQuery = input.value.trim();
const selectHistoryQuery = (query) => {
    input.value = query;
    previousInputQuery = query;
    controller.searchQuery(query);
};
const refreshHistory = () => {
    renderHistory(historyContainer, history.getAll(), selectHistoryQuery);
};
const controller = new SearchController((state) => renderState(results, details, state, controller), 300, 10000, (query) => {
    history.add(query);
    refreshHistory();
});
input.addEventListener('input', () => {
    const query = input.value.trim();
    if (previousInputQuery.length > 0 &&
        query.length > previousInputQuery.length &&
        query.startsWith(previousInputQuery)) {
        history.remove(previousInputQuery);
        refreshHistory();
    }
    previousInputQuery = query;
    controller.setQuery(input.value);
});
form.addEventListener('submit', (event) => {
    event.preventDefault();
    controller.searchNow();
});
window.addEventListener('pagehide', () => controller.dispose(), { once: true });
refreshHistory();
renderState(results, details, { status: 'idle' }, controller);
//# sourceMappingURL=main.js.map