// PDF режим (netto/brutto/both) – localStorage
export function loadPdfSettingsFromStorage() {
    try {
        const raw = localStorage.getItem("wycenaPdfSettings");
        if (!raw) return { priceMode: "netto", priceDisplay: "netto" };
        const parsed = JSON.parse(raw);
        const validDisplayModes = ["netto", "brutto", "both"];
        return { 
            priceMode: parsed.priceMode === "brutto" ? "brutto" : "netto",
            priceDisplay: validDisplayModes.includes(parsed.priceDisplay) ? parsed.priceDisplay : "netto"
        };
    } catch { return { priceMode: "netto", priceDisplay: "netto" }; }
}

export function savePdfSettingsToStorage(settings) {
    try { localStorage.setItem("wycenaPdfSettings", JSON.stringify(settings)); } catch {}
}