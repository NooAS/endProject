import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Получить категории пользователя
export const getCategories = async(req, res) => {
    try {
        const userId = req.user.userId;

        const categories = await prisma.category.findMany({
            where: { userId },
            orderBy: { order: "asc" }
        });

        res.json(categories);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};

// Создать категорию
export const createCategory = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { name, order } = req.body;

        const category = await prisma.category.create({
            data: { name, order, userId }
        });

        res.json(category);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};

// Удалить категорию
export const deleteCategory = async(req, res) => {
    try {
        const userId = req.user.userId;
        const id = Number(req.params.id);

        // безопасно: удаляем только свои категории
        await prisma.category.deleteMany({
            where: { id, userId }
        });

        res.json({ message: "Deleted" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};