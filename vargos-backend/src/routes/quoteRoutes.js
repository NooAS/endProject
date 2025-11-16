import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/* --------------------------------------------------------
   Сохранение НОВОЙ сметы
-------------------------------------------------------- */
router.post("/save", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;
        const { name, total, items } = req.body;

        if (!name || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid quote data" });
        }

        const quote = await prisma.quote.create({
            data: {
                name,
                total,
                userId,
                items: {
                    create: items.map(i => ({
                        category: i.category,
                        room: i.room,
                        job: i.job,
                        quantity: i.quantity,
                        price: i.price,
                        total: i.total
                    }))
                }
            }
        });

        res.json({ message: "Смета сохранена", quoteId: quote.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


/* --------------------------------------------------------
   Получить ВСЕ сметы пользователя (история)
-------------------------------------------------------- */
router.get("/my", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;

        const quotes = await prisma.quote.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { items: true }
        });

        res.json(quotes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


/* --------------------------------------------------------
   Получить ОДНУ смету по ID (для редактирования)
-------------------------------------------------------- */
router.get("/:id", authMiddleware, async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.userId;

        const quote = await prisma.quote.findFirst({
            where: { id, userId },
            include: { items: true }
        });

        if (!quote) {
            return res.status(404).json({ message: "Смета не найдена" });
        }

        res.json(quote);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


/* --------------------------------------------------------
   Редактировать смету
-------------------------------------------------------- */
router.put("/:id", authMiddleware, async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.userId;
        const { name, total, items } = req.body;

        // Проверяем, что смета принадлежит пользователю
        const existing = await prisma.quote.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ message: "Смета не найдена" });
        }

        // Обновляем заголовок
        await prisma.quote.update({
            where: { id },
            data: { name, total }
        });

        // Удаляем старые позиции
        await prisma.quoteItem.deleteMany({
            where: { quoteId: id }
        });

        // Добавляем новые позиции
        await prisma.quoteItem.createMany({
            data: items.map(i => ({
                quoteId: id,
                category: i.category,
                room: i.room,
                job: i.job,
                quantity: i.quantity,
                price: i.price,
                total: i.total
            }))
        });

        res.json({ message: "Смета обновлена" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


/* --------------------------------------------------------
   Удалить смету
-------------------------------------------------------- */
router.delete("/:id", authMiddleware, async(req, res) => {
    try {
        const id = Number(req.params.id);
        const userId = req.user.userId;

        const existing = await prisma.quote.findFirst({
            where: { id, userId }
        });

        if (!existing) {
            return res.status(404).json({ message: "Смета не найдена" });
        }

        await prisma.quoteItem.deleteMany({
            where: { quoteId: id }
        });

        await prisma.quote.delete({
            where: { id }
        });

        res.json({ message: "Смета удалена" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;

router.get("/:id", authMiddleware, async(req, res) => {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
        where: { id: Number(id) },
        include: { items: true }
    });

    if (!quote) return res.status(404).json({ message: "Not found" });

    // защита: чужую смету нельзя грузить
    if (quote.userId !== req.user.userId) {
        return res.status(403).json({ message: "Forbidden" });
    }

    res.json(quote);
});