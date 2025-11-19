// Категории – localStorage
export function saveCategoriesToStorage(project) {
    try {
        const data = {
            categories: project.categories,
            catAutoId: project._catAutoId,
            tplAutoId: project._tplAutoId
        };
        localStorage.setItem("wycenaCategories", JSON.stringify(data));
    } catch(e) { console.warn("Cannot save categories", e); }
}
export function loadCategoriesFromStorage() {
    try {
        const raw = localStorage.getItem("wycenaCategories");
        if (!raw) return null;
        return JSON.parse(raw);
    } catch { return null; }
}