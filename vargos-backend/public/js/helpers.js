// Форматирование и localStorage

export function formatNumberPL(value) {
    const f = new Intl.NumberFormat("pl-PL", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return f.format(value || 0);
}

export function formatCurrency(value) {
    return formatNumberPL(value) + " zł";
}

export function loadCompanyDataFromStorage() {
    try { const raw = localStorage.getItem("wycenaCompanyData"); if (!raw) return null; return JSON.parse(raw); } catch { return null; }
}
export function saveCompanyDataToStorage(data) {
    try { localStorage.setItem("wycenaCompanyData", JSON.stringify(data)); } catch { }
}