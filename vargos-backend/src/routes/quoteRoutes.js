import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// Сохранение сметы
router.post("/save", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId; // извлекаем из токена
        const { name, total, items } = req.body;

        if (!name || !items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid quote data" });
        }

        // Создаём смету
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

        res.json({
            message: "Смета сохранена",
            quoteId: quote.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Получить мои сметы
router.get("/my", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;

        const quotes = await prisma.quote.findMany({
            where: { userId },
            include: { items: true }
        });

        res.json({
            userId,
            quotes
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;