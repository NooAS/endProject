const prisma = require("../prisma");

// ===== Сохранение новой сметы =====
exports.saveQuote = async(req, res) => {
    try {
        const userId = req.user.id;
        const { name, total, items } = req.body;

        // 1. Создаём Quote
        const quote = await prisma.quote.create({
            data: {
                name,
                total,
                userId
            }
        });

        // 2. Создаём элементы
        const quoteItemsData = items.map(it => ({
            quoteId: quote.id,
            category: it.category || null,
            room: it.room || null,
            job: it.job,
            quantity: it.quantity,
            price: it.price,
            total: it.total
        }));

        await prisma.quoteItem.createMany({
            data: quoteItemsData
        });

        res.json({ success: true, quoteId: quote.id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Ошибка сохранения сметы" });
    }
};


// ===== История смет =====
exports.getQuotes = async(req, res) => {
    try {
        const userId = req.user.id;

        const quotes = await prisma.quote.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });

        res.json(quotes);
    } catch (e) {
        res.status(500).json({ error: "Ошибка загрузки истории" });
    }
};


// ===== Загрузка одной сметы (для редактирования) =====
exports.getQuote = async(req, res) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);

        const quote = await prisma.quote.findFirst({
            where: { id, userId },
            include: { items: true }
        });

        if (!quote) return res.status(404).json({ error: "Смета не найдена" });

        res.json(quote);
    } catch (e) {
        res.status(500).json({ error: "Ошибка загрузки сметы" });
    }
};


// ===== Обновление сметы =====
exports.updateQuote = async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.id;
        const { name, total, items } = req.body;

        // 1. Проверяем владельца
        const existing = await prisma.quote.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: "Смета не найдена" });
        }

        // 2. Обновление заголовка
        await prisma.quote.update({
            where: { id },
            data: { name, total }
        });

        // 3. Удаляем старые позиции
        await prisma.quoteItem.deleteMany({
            where: { quoteId: id }
        });

        // 4. Добавляем новые позиции
        const newItems = items.map(it => ({
            quoteId: id,
            category: it.category || null,
            room: it.room || null,
            job: it.job,
            quantity: it.quantity,
            price: it.price,
            total: it.total
        }));

        await prisma.quoteItem.createMany({
            data: newItems
        });

        res.json({ success: true });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Ошибка обновления сметы" });
    }
};


// ===== Удаление сметы =====
exports.deleteQuote = async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.id;

        // проверяем принадлежность
        const existing = await prisma.quote.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: "Смета не найдена" });
        }

        // удаляем
        await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
        await prisma.quote.delete({ where: { id } });

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Ошибка удаления сметы" });
    }
};