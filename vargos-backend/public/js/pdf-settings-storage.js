// PDF режим (netto/brutto) – localStorage
export function loadPdfSettingsFromStorage() {
    try {
        const raw = localStorage.getItem("wycenaPdfSettings");
        if (!raw) return { priceMode: "netto" };
        const parsed = JSON.parse(raw);
        return { priceMode: parsed.priceMode === "brutto" ? "brutto" : "netto" };
    } catch { return { priceMode: "netto" }; }
}
export function savePdfSettingsToStorage(settings) {
    try { localStorage.setItem("wycenaPdfSettings", JSON.stringify(settings)); } catch { }
}