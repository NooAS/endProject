import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const saveQuote = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { id, name, total, items, notes, config } = req.body;

        if (!name || !items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid data" });
        }

        let quote;

        // если id есть → обновляем и создаем версию
        if (id) {
            // Получаем текущую смету для создания версии
            const currentQuote = await prisma.quote.findUnique({
                where: { id },
                include: { items: true }
            });

            if (currentQuote) {
                // Создаем версию перед обновлением
                await prisma.quoteVersion.create({
                    data: {
                        quoteId: id,
                        version: currentQuote.version,
                        name: currentQuote.name,
                        total: currentQuote.total,
                        notes: currentQuote.notes,
                        config: currentQuote.config || null,
                        data: {
                            items: currentQuote.items,
                            config: currentQuote.config
                        }
                    }
                });
            }

            // Сначала удаляем старые items
            await prisma.quoteItem.deleteMany({
                where: { quoteId: id }
            });
            
            // Затем обновляем quote и создаем новые items
            quote = await prisma.quote.update({
                where: { id },
                data: {
                    name,
                    total,
                    notes: notes || null,
                    config: config || null,
                    version: { increment: 1 },
                    items: {
                        create: items
                    }
                }
            });
        } else {
            // Проверяем, существует ли смета с таким же именем
            const existingQuote = await prisma.quote.findFirst({
                where: {
                    userId,
                    name
                }
            });

            if (existingQuote) {
                // Если существует - обновляем и создаем версию
                // Получаем текущую смету для создания версии
                const currentQuote = await prisma.quote.findUnique({
                    where: { id: existingQuote.id },
                    include: { items: true }
                });

                if (currentQuote) {
                    // Создаем версию перед обновлением
                    await prisma.quoteVersion.create({
                        data: {
                            quoteId: existingQuote.id,
                            version: currentQuote.version,
                            name: currentQuote.name,
                            total: currentQuote.total,
                            notes: currentQuote.notes,
                            config: currentQuote.config || null,
                            data: {
                                items: currentQuote.items,
                                config: currentQuote.config
                            }
                        }
                    });
                }

                // Сначала удаляем старые items
                await prisma.quoteItem.deleteMany({
                    where: { quoteId: existingQuote.id }
                });
                
                // Затем обновляем quote и создаем новые items
                quote = await prisma.quote.update({
                    where: { id: existingQuote.id },
                    data: {
                        name,
                        total,
                        notes: notes || null,
                        config: config || null,
                        version: { increment: 1 },
                        items: {
                            create: items
                        }
                    }
                });
            } else {
                // создаём новую
                quote = await prisma.quote.create({
                    data: {
                        userId,
                        name,
                        total,
                        notes: notes || null,
                        config: config || null,
                        version: 1,
                        items: {
                            create: items
                        }
                    }
                });
            }
        }

        res.json({ success: true, quoteId: quote.id, version: quote.version });

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyQuotes = async(req, res) => {
    try {
        const quotes = await prisma.quote.findMany({
            where: { userId: req.user.userId },
            include: { items: true },
            orderBy: { createdAt: "desc" }
        });

        res.json(quotes);
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getQuoteById = async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.userId;

        const q = await prisma.quote.findFirst({
            where: { id, userId },
            include: { items: true }
        });

        if (!q) return res.status(404).json({ message: "Not found" });

        res.json(q);

    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteQuoteById = async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.userId;

        const q = await prisma.quote.findFirst({
            where: { id, userId }
        });

        if (!q) return res.status(404).json({ message: "Not found" });

        await prisma.quoteItem.deleteMany({
            where: { quoteId: id }
        });

        await prisma.quote.delete({
            where: { id }
        });

        res.json({ success: true });

    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getQuoteVersions = async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.userId;

        const quote = await prisma.quote.findFirst({
            where: { id, userId }
        });

        if (!quote) return res.status(404).json({ message: "Not found" });

        const versions = await prisma.quoteVersion.findMany({
            where: { quoteId: id },
            orderBy: { version: "desc" }
        });

        res.json(versions);

    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

export const compareQuoteVersions = async(req, res) => {
    try {
        const id = Number(req.params.id);
        const version1 = Number(req.query.v1);
        const version2 = Number(req.query.v2);
        const userId = req.user.userId;

        const quote = await prisma.quote.findFirst({
            where: { id, userId }
        });

        if (!quote) return res.status(404).json({ message: "Not found" });

        const [ver1, ver2] = await Promise.all([
            prisma.quoteVersion.findFirst({
                where: { quoteId: id, version: version1 }
            }),
            prisma.quoteVersion.findFirst({
                where: { quoteId: id, version: version2 }
            })
        ]);

        if (!ver1 || !ver2) {
            return res.status(404).json({ message: "Version not found" });
        }

        res.json({ version1: ver1, version2: ver2 });

    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};