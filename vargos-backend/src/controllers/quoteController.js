import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Helper function to create a version snapshot
async function createVersionSnapshot(quoteId, userId) {
    try {
        const quote = await prisma.quote.findFirst({
            where: { id: quoteId, userId },
            include: { items: true }
        });

        if (!quote) return null;

        // Get the current version number
        const lastVersion = await prisma.quoteVersion.findFirst({
            where: { quoteId },
            orderBy: { versionNum: 'desc' }
        });

        const versionNum = lastVersion ? lastVersion.versionNum + 1 : 1;

        // Create snapshot with full quote data
        const snapshotData = {
            name: quote.name,
            total: quote.total,
            notes: quote.notes,
            items: quote.items.map(item => ({
                category: item.category,
                room: item.room,
                job: item.job,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                materialPrice: item.materialPrice,
                laborPrice: item.laborPrice,
                templateId: item.templateId
            }))
        };

        // Generate change summary
        const changeSummary = lastVersion 
            ? generateChangeSummary(lastVersion.snapshotData, snapshotData)
            : "Initial version";

        // Create version record
        await prisma.quoteVersion.create({
            data: {
                quoteId,
                versionNum,
                name: quote.name,
                total: quote.total,
                notes: quote.notes,
                snapshotData,
                changeSummary
            }
        });

        return versionNum;
    } catch (error) {
        console.error("Error creating version snapshot:", error);
        return null;
    }
}

// Helper function to generate change summary
function generateChangeSummary(oldData, newData) {
    const changes = [];
    
    if (oldData.name !== newData.name) {
        changes.push(`Название изменено с "${oldData.name}" на "${newData.name}"`);
    }
    
    if (oldData.total !== newData.total) {
        const diff = (newData.total - oldData.total).toFixed(2);
        changes.push(`Сумма изменена на ${diff > 0 ? '+' : ''}${diff} zł`);
    }
    
    const oldItemCount = oldData.items?.length || 0;
    const newItemCount = newData.items?.length || 0;
    
    if (oldItemCount !== newItemCount) {
        const diff = newItemCount - oldItemCount;
        changes.push(`Количество позиций: ${diff > 0 ? '+' : ''}${diff}`);
    }
    
    return changes.length > 0 ? changes.join('; ') : "Изменения в деталях";
}

export const saveQuote = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { id, name, total, items, notes } = req.body;

        if (!name || !items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid data" });
        }

        let quote;
        let isUpdate = false;

        // если id есть → обновляем
        if (id) {
            isUpdate = true;
            
            // Create version snapshot before update
            await createVersionSnapshot(id, userId);
            
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
            const existingQuote = await prisma.quote.findFirst({
                where: {
                    userId,
                    name
                }
            });

            if (existingQuote) {
                isUpdate = true;
                
                // Create version snapshot before update
                await createVersionSnapshot(existingQuote.id, userId);
                
                // Если существует - обновляем
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
                        items: {
                            create: items
                        }
                    }
                });
                
                // Create initial version
                await createVersionSnapshot(quote.id, userId);
            }
        }

        res.json({ success: true, quoteId: quote.id, isUpdate });

    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyQuotes = async(req, res) => {
    try {
        const quotes = await prisma.quote.findMany({
            where: { userId: req.user.userId },
            include: { 
                items: true,
                _count: {
                    select: { versions: true }
                }
            },
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

        // Cascade delete will handle versions and items
        await prisma.quote.delete({
            where: { id }
        });

        res.json({ success: true });

    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get version history for a quote
export const getQuoteVersions = async(req, res) => {
    try {
        const quoteId = Number(req.params.id);
        const userId = req.user.userId;

        // Verify ownership
        const quote = await prisma.quote.findFirst({
            where: { id: quoteId, userId }
        });

        if (!quote) return res.status(404).json({ message: "Quote not found" });

        const versions = await prisma.quoteVersion.findMany({
            where: { quoteId },
            orderBy: { versionNum: 'desc' }
        });

        res.json(versions);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};

// Get specific version
export const getQuoteVersion = async(req, res) => {
    try {
        const quoteId = Number(req.params.id);
        const versionNum = Number(req.params.versionNum);
        const userId = req.user.userId;

        // Verify ownership
        const quote = await prisma.quote.findFirst({
            where: { id: quoteId, userId }
        });

        if (!quote) return res.status(404).json({ message: "Quote not found" });

        const version = await prisma.quoteVersion.findFirst({
            where: { quoteId, versionNum }
        });

        if (!version) return res.status(404).json({ message: "Version not found" });

        res.json(version);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};

// Compare two versions
export const compareQuoteVersions = async(req, res) => {
    try {
        const quoteId = Number(req.params.id);
        const version1Num = Number(req.query.v1);
        const version2Num = Number(req.query.v2);
        const userId = req.user.userId;

        // Verify ownership
        const quote = await prisma.quote.findFirst({
            where: { id: quoteId, userId }
        });

        if (!quote) return res.status(404).json({ message: "Quote not found" });

        const [version1, version2] = await Promise.all([
            prisma.quoteVersion.findFirst({ where: { quoteId, versionNum: version1Num } }),
            prisma.quoteVersion.findFirst({ where: { quoteId, versionNum: version2Num } })
        ]);

        if (!version1 || !version2) {
            return res.status(404).json({ message: "One or both versions not found" });
        }

        // Generate detailed comparison
        const comparison = {
            version1: {
                versionNum: version1.versionNum,
                name: version1.name,
                total: version1.total,
                notes: version1.notes,
                createdAt: version1.createdAt,
                itemCount: version1.snapshotData.items?.length || 0
            },
            version2: {
                versionNum: version2.versionNum,
                name: version2.name,
                total: version2.total,
                notes: version2.notes,
                createdAt: version2.createdAt,
                itemCount: version2.snapshotData.items?.length || 0
            },
            differences: {
                nameChanged: version1.name !== version2.name,
                totalDiff: version2.total - version1.total,
                notesChanged: version1.notes !== version2.notes,
                itemCountDiff: (version2.snapshotData.items?.length || 0) - (version1.snapshotData.items?.length || 0)
            },
            items: compareItems(version1.snapshotData.items || [], version2.snapshotData.items || [])
        };

        res.json(comparison);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper function to compare items
function compareItems(items1, items2) {
    const result = {
        added: [],
        removed: [],
        modified: []
    };

    // Create maps for easier comparison
    const map1 = new Map(items1.map((item, idx) => [
        `${item.room || ''}_${item.job}_${idx}`, 
        { ...item, index: idx }
    ]));
    
    const map2 = new Map(items2.map((item, idx) => [
        `${item.room || ''}_${item.job}_${idx}`, 
        { ...item, index: idx }
    ]));

    // Find added and modified items
    items2.forEach((item2, idx) => {
        const key = `${item2.room || ''}_${item2.job}_${idx}`;
        const item1 = map1.get(key);
        
        if (!item1) {
            // Check if similar item exists (same job name)
            const similar = items1.find(i => i.job === item2.job);
            if (!similar) {
                result.added.push(item2);
            } else {
                result.modified.push({ old: similar, new: item2 });
            }
        } else if (JSON.stringify(item1) !== JSON.stringify({ ...item2, index: item1.index })) {
            result.modified.push({ old: item1, new: item2 });
        }
    });

    // Find removed items
    items1.forEach((item1, idx) => {
        const key = `${item1.room || ''}_${item1.job}_${idx}`;
        if (!map2.has(key)) {
            const similar = items2.find(i => i.job === item1.job);
            if (!similar) {
                result.removed.push(item1);
            }
        }
    });

    return result;
}

// Restore a specific version
export const restoreQuoteVersion = async(req, res) => {
    try {
        const quoteId = Number(req.params.id);
        const versionNum = Number(req.params.versionNum);
        const userId = req.user.userId;

        // Verify ownership
        const quote = await prisma.quote.findFirst({
            where: { id: quoteId, userId }
        });

        if (!quote) return res.status(404).json({ message: "Quote not found" });

        const version = await prisma.quoteVersion.findFirst({
            where: { quoteId, versionNum }
        });

        if (!version) return res.status(404).json({ message: "Version not found" });

        // Create snapshot of current state before restoring
        await createVersionSnapshot(quoteId, userId);

        // Delete current items
        await prisma.quoteItem.deleteMany({
            where: { quoteId }
        });

        // Restore from snapshot
        const snapshotData = version.snapshotData;
        await prisma.quote.update({
            where: { id: quoteId },
            data: {
                name: snapshotData.name,
                total: snapshotData.total,
                notes: snapshotData.notes,
                items: {
                    create: snapshotData.items
                }
            }
        });

        res.json({ success: true, message: `Restored to version ${versionNum}` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};