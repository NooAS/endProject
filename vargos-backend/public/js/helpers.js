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

// Server-side company data functions
export async function loadCompanyDataFromServer() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    try {
        const res = await fetch("/auth/company-data", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.defaultCompanyData || null;
    } catch {
        return null;
    }
}

export async function saveCompanyDataToServer(companyData) {
    const token = localStorage.getItem("token");
    if (!token) return false;
    
    try {
        const res = await fetch("/auth/company-data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ companyData })
        });
        return res.ok;
    } catch {
        return false;
    }
}