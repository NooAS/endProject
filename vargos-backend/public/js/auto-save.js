const AUTO_SAVE_KEY = "project_draft";

// Включение автосохранения с debounce (2 сек)
export function enableAutoSave(getProjectData) {
    let timer = null;
    return function autoSave() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            const data = getProjectData();
            try {
                localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn("Auto-save failed:", e);
            }
        }, 2000);
    };
}

export function getSavedDraft() {
    const draft = localStorage.getItem(AUTO_SAVE_KEY);
    if (!draft) return null;
    try {
        return JSON.parse(draft);
    } catch {
        return null;
    }
}

export function clearSavedDraft() {
    localStorage.removeItem(AUTO_SAVE_KEY);
}