// Работа с сервером: сохранение и история смет

export function buildItemsArray(project) {
    const items = [];
    for (const room of project.rooms) {
        for (const w of room.works) {
            items.push({
                category: w.categoryId ? String(w.categoryId) : null,
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
        console.warn("Пользователь не авторизован — пропускаем сохранение");
        return;
    }
    var items = buildItemsArray(project);
    var totals = project.getTotals();
    var payload = {
        name: project.name,
        total: totals.brutto,
        items: items,
        notes: project.notes || null
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
        if (!res.ok) { console.error("Ошибка сохранения:", json); }
        else { 
            console.log("Смета сохранена успешно:", json);
            // Если это была новая смета, сохраним её ID для последующих обновлений
            if (json.quoteId && !editQuoteId) {
                localStorage.setItem("editQuoteId", json.quoteId);
            }
        }
    } catch (e) {
        console.error("Ошибка сети:", e);
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