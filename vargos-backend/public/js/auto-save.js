const AUTO_SAVE_KEY = "project_draft";
const AUTO_SAVE_TIMESTAMP_KEY = "project_draft_timestamp";

// Включение автосохранения с debounce (5 сек)
export function enableAutoSave(getProjectData) {
    let timer = null;
    return function autoSave() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            const data = getProjectData();
            try {
                localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
                localStorage.setItem(AUTO_SAVE_TIMESTAMP_KEY, Date.now().toString());
                // Показываем индикатор сохранения
                showAutoSaveIndicator();
            } catch (e) {
                console.warn("Auto-save failed:", e);
            }
        }, 5000); // Изменено с 2000 на 5000 мс (5 секунд)
    };
}

export function getSavedDraft() {
    const draft = localStorage.getItem(AUTO_SAVE_KEY);
    const timestamp = localStorage.getItem(AUTO_SAVE_TIMESTAMP_KEY);
    if (!draft) return null;
    try {
        const data = JSON.parse(draft);
        data._savedAt = timestamp ? new Date(parseInt(timestamp)) : null;
        return data;
    } catch {
        return null;
    }
}

export function clearSavedDraft() {
    localStorage.removeItem(AUTO_SAVE_KEY);
    localStorage.removeItem(AUTO_SAVE_TIMESTAMP_KEY);
}

// Показывает индикатор автосохранения
function showAutoSaveIndicator() {
    let indicator = document.getElementById('auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'auto-save-indicator';
        indicator.style.position = 'fixed';
        indicator.style.top = '10px';
        indicator.style.right = '10px';
        indicator.style.padding = '8px 12px';
        indicator.style.backgroundColor = '#10b981';
        indicator.style.color = 'white';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = '12px';
        indicator.style.zIndex = '10000';
        indicator.style.opacity = '0';
        indicator.style.transition = 'opacity 0.3s';
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = '✓ Автосохранено';
    indicator.style.opacity = '1';
    
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}