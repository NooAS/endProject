import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const saveQuote = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { id, name, total, items, notes } = req.body;

        if (!name || !items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid data" });
        }

        let quote;

        // если id есть → обновляем
        if (id) {
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
                    items: {
                        create: items
                    }
                }
            });
        } else {
            // Проверяем, существует ли смета с таким же именем
            const existingQuotes = await prisma.quote.findMany({
                where: {
                    userId,
                    name
                },
                orderBy: {
                    version: 'desc'
                }
            });

            if (existingQuotes.length > 0) {
                // Если существует - создаём новую версию
                const latestVersion = existingQuotes[0].version;
                const parentId = existingQuotes[0].parentQuoteId || existingQuotes[0].id;
                
                quote = await prisma.quote.create({
                    data: {
                        userId,
                        name,
                        total,
                        notes: notes || null,
                        version: latestVersion + 1,
                        parentQuoteId: parentId,
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
                        version: 1,
                        items: {
                            create: items
                        }
                    }
                });
            }
        }

        res.json({ success: true, quoteId: quote.id });

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyQuotes = async(req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get all quotes for the user
        const allQuotes = await prisma.quote.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: "desc" }
        });

        // Group quotes by name and get the latest version of each
        const quotesByName = {};
        const versionCounts = {};
        
        for (const quote of allQuotes) {
            if (!quotesByName[quote.name]) {
                quotesByName[quote.name] = quote;
                versionCounts[quote.name] = 1;
            } else {
                // Keep the latest version (higher version number or newer createdAt)
                const existing = quotesByName[quote.name];
                if (quote.version > existing.version || 
                    (quote.version === existing.version && quote.createdAt > existing.createdAt)) {
                    quotesByName[quote.name] = quote;
                }
                versionCounts[quote.name]++;
            }
        }

        // Convert to array and add version count
        const latestQuotes = Object.values(quotesByName).map(quote => ({
            ...quote,
            versionCount: versionCounts[quote.name]
        }));

        // Sort by createdAt descending
        latestQuotes.sort((a, b) => b.createdAt - a.createdAt);

        res.json(latestQuotes);
    } catch (e) {
        console.error(e);
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

// Update quote status (normal -> inProgress -> finished)
export const updateQuoteStatus = async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.userId;
        const { status, dailyEarnings } = req.body;

        // Validate status parameter
        const validStatuses = ["normal", "inProgress", "finished"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be one of: normal, inProgress, finished" });
        }

        const q = await prisma.quote.findFirst({
            where: { id, userId }
        });

        if (!q) return res.status(404).json({ message: "Not found" });

        const updateData = { status };

        // When setting to inProgress, record startedAt
        if (status === "inProgress" && q.status !== "inProgress") {
            updateData.startedAt = new Date();
            updateData.finishedAt = null;
        }

        // When setting to finished, record finishedAt
        if (status === "finished") {
            updateData.finishedAt = new Date();
        }

        // When returning to normal, clear dates
        if (status === "normal") {
            updateData.startedAt = null;
            updateData.finishedAt = null;
            updateData.dailyEarnings = null;
        }

        // Update daily earnings if provided
        if (dailyEarnings !== undefined) {
            updateData.dailyEarnings = dailyEarnings;
        }

        const updated = await prisma.quote.update({
            where: { id },
            data: updateData
        });

        res.json({ success: true, quote: updated });

    } catch (e) {
        console.error("Error updating quote status:", e);
        res.status(500).json({ message: "Server error" });
    }
};

// Get quotes by status
export const getQuotesByStatus = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { status } = req.params;

        const quotes = await prisma.quote.findMany({
            where: { userId, status },
            include: { items: true },
            orderBy: { createdAt: "desc" }
        });

        res.json(quotes);
    } catch (e) {
        console.error("Error getting quotes by status:", e);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all versions of a quote by name
export const getQuoteVersions = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { name } = req.params;

        const quotes = await prisma.quote.findMany({
            where: { 
                userId, 
                name: decodeURIComponent(name) 
            },
            include: { items: true },
            orderBy: [
                { version: "desc" },
                { createdAt: "desc" }
            ]
        });

        if (quotes.length === 0) {
            return res.status(404).json({ message: "No versions found" });
        }

        res.json(quotes);
    } catch (e) {
        console.error("Error getting quote versions:", e);
        res.status(500).json({ message: "Server error" });
    }
};