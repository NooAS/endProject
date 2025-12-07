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

export async function exportCategoriesFromServer() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Musisz być zalogowany, aby eksportować kategorie");
        return;
    }

    try {
        const res = await fetch("/categories/export", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) {
            throw new Error("Błąd eksportu kategorii");
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `categories-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (e) {
        console.error("Export error:", e);
        alert("Błąd podczas eksportowania kategorii");
    }
}

export async function importCategoriesToServer(fileContent, replaceExisting = false) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Musisz być zalogowany, aby importować kategorie");
        return false;
    }

    try {
        let data;
        try {
            data = JSON.parse(fileContent);
        } catch (parseError) {
            alert("Nieprawidłowy format pliku JSON");
            return false;
        }
        
        if (!data.categories || !Array.isArray(data.categories)) {
            alert("Nieprawidłowy format pliku - brak tablicy kategorii");
            return false;
        }

        const res = await fetch("/categories/import", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                categories: data.categories,
                replaceExisting
            })
        });

        if (!res.ok) {
            throw new Error("Błąd importu kategorii");
        }

        return true;
    } catch (e) {
        console.error("Import error:", e);
        alert("Błąd podczas importowania kategorii: " + e.message);
        return false;
    }
}