// Серверные запросы для категорий/шаблонов

export async function createCategoryOnServer(name) {
    const token = localStorage.getItem("token");
    await fetch("/categories", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });
}
export async function updateCategoryOnServer(id, name) {
    const token = localStorage.getItem("token");
    await fetch(`/categories/${id}`, {
        method: "PUT",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    });
}
export async function deleteCategoryFromServer(id) {
    const token = localStorage.getItem("token");
    await fetch(`/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
}
export async function createTemplateOnServer(categoryId, template) {
    const token = localStorage.getItem("token");
    await fetch(`/categories/${categoryId}/template`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(template)
    });
}
export async function updateTemplateOnServer(templateId, template) {
    const token = localStorage.getItem("token");
    await fetch(`/categories/template/${templateId}`, {
        method: "PUT",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(template)
    });
}
export async function deleteTemplateFromServer(templateId) {
    const token = localStorage.getItem("token");
    await fetch(`/categories/template/${templateId}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
}

// ...другие импорты и функции...

export async function loadCategoriesFromServer() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("No token found — categories not loaded");
        return [];
    }
    let res;
    try {
        res = await fetch("/categories", {
            headers: { "Authorization": "Bearer " + token }
        });
    } catch (e) {
        console.error("Network error while loading categories:", e);
        return [];
    }
    if (!res.ok) {
        console.error("Server returned error:", res.status, await res.text());
        return [];
    }
    let list;
    try {
        list = await res.json();
    } catch (e) {
        console.error("Invalid JSON returned:", e);
        return [];
    }
    if (!Array.isArray(list)) {
        console.error("Categories response is NOT array:", list);
        return [];
    }
    // Обнови проект глобально, если тебе нужно — возвращает список категорий
    return list.map(c => ({
        id: c.id,
        name: c.name,
        templates: Array.isArray(c.templates) ?
            c.templates.map(t => ({
                id: t.id,
                name: t.name,
                defaults: t.defaults,
                categoryId: c.id
            })) : []
    }));
}