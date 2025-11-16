import prisma from "../db/prisma.js";

// Получить все категории
export const getCategories = async(req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { order: "asc" },
            include: {
                jobs: true
            }
        });
        res.json(categories);
    } catch (err) {
        console.error("getCategories error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Создать категорию
export const createCategory = async(req, res) => {
    try {
        const { name, order, isDefault } = req.body;

        const category = await prisma.category.create({
            data: { name, order, isDefault }
        });

        res.json(category);
    } catch (err) {
        console.error("createCategory error:", err);
        res.status(500).json({ error: "Server error" });
    }
};