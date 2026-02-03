// Работа с сервером: сохранение и история смет

export function buildItemsArray(project) {
    const items = [];
    for (const room of project.rooms) {
        for (const w of room.works) {
            // Find category and template names for fallback matching
            let categoryName = null;
            let templateName = null;
            
            if (w.categoryId && project.categories) {
                const cat = project.categories.find(c => c.id === w.categoryId);
                if (cat) {
                    categoryName = cat.name;
                    if (w.templateId && cat.templates) {
                        const tpl = cat.templates.find(t => t.id === w.templateId);
                        if (tpl) {
                            templateName = tpl.name;
                        }
                    }
                }
            }
            
            items.push({
                category: w.categoryId ? String(w.categoryId) : null,
                categoryName: categoryName,
                templateName: templateName,
                room: room.name || null,
                job: w.name || "",
                quantity: w.quantity || 0,
                price: w.clientPrice || 0,
                total: w.clientTotal || 0,
                materialPrice: w.materialPrice,
                laborPrice: w.laborPrice,
                templateId: w.templateId
            });
        }
    }
    return items;
}

export async function saveQuoteToServer(project) {
    var token = localStorage.getItem("token");
    if (!token) {
        console.warn("Użytkownik nie jest zalogowany — pomijanie zapisu");
        return;
    }
    var items = buildItemsArray(project);
    var totals = project.getTotals();
    var payload = {
        name: project.name,
        total: totals.brutto,
        items: items,
        notes: project.notes || null,
        clientNotes: project.clientNotes || null
    };

    // Если редактируем существующую смету
    const editQuoteId = localStorage.getItem("editQuoteId");
    if (editQuoteId) {
        payload.id = Number(editQuoteId);
    }

    try {
        var res = await fetch("/quotes/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(payload)
        });
        var json = await res.json();
        if (!res.ok) { console.error("Błąd zapisu:", json); }
        else { 
            console.log("Kosztorys zapisany pomyślnie:", json);
            // Если это была новая смета, сохраним её ID для последующих обновлений
            if (json.quoteId && !editQuoteId) {
                localStorage.setItem("editQuoteId", json.quoteId);
            }
        }
    } catch (e) {
        console.error("Błąd sieci:", e);
    }
}

export async function loadQuotesHistory(renderCallback) {
    const token = localStorage.getItem("token");
    const res = await fetch("/quotes/my", {
        headers: { "Authorization": "Bearer " + token }
    });
    const quotes = await res.json();
    if (typeof renderCallback === "function") renderCallback(quotes);
}

// Update quote status
export async function updateQuoteStatus(quoteId, status, dailyEarnings = null) {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("Użytkownik nie jest zalogowany");
        return null;
    }

    try {
        const body = { status };
        if (dailyEarnings !== null) {
            body.dailyEarnings = dailyEarnings;
        }

        const res = await fetch(`/quotes/${quoteId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(body)
        });

        const json = await res.json();
        if (!res.ok) {
            console.error("Błąd aktualizacji statusu:", json);
            return null;
        }
        return json;
    } catch (e) {
        console.error("Błąd sieci:", e);
        return null;
    }
}

// Get quotes by status
export async function getQuotesByStatus(status) {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("Użytkownik nie jest zalogowany");
        return [];
    }

    try {
        const res = await fetch(`/quotes/status/${status}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const quotes = await res.json();
        return Array.isArray(quotes) ? quotes : [];
    } catch (e) {
        console.error("Błąd sieci:", e);
        return [];
    }
}

// Delete quote
export async function deleteQuoteFromServer(quoteId) {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("Użytkownik nie jest zalogowany");
        return false;
    }

    try {
        const res = await fetch(`/quotes/${quoteId}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });
        return res.ok;
    } catch (e) {
        console.error("Błąd sieci:", e);
        return false;
    }
}