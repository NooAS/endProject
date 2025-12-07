import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();
import express from "express";
import auth from "../middlewares/authMiddleware.js"; // <-- ВАЖНО
import {
    createCategory,
    deleteCategory,
    createTemplate
} from "../controllers/categoryController.js";


/* ===============================
   Получить категории пользователя
=============================== */
router.get("/", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;

        const categories = await prisma.category.findMany({
            where: { userId },
            orderBy: { order: 'asc' },
            include: {
                templates: true // <-- ВОТ ЭТО ДОЛЖНО БЫТЬ
            }
        });

        const result = categories.map(c => ({
            id: c.id,
            name: c.name,
            order: c.order,
            templates: c.templates.map(t => ({
                id: t.id,
                name: t.name,
                defaults: typeof t.defaults === "string" ?
                    JSON.parse(t.defaults) : t.defaults || null
            }))
        }));

        res.json(result);

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Ошибка загрузки категорий" });
    }
});

/* ===============================
   Экспорт категорий и шаблонов
=============================== */
router.get("/export", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;

        const categories = await prisma.category.findMany({
            where: { userId },
            orderBy: { order: 'asc' },
            include: {
                templates: true
            }
        });

        const exportData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            categories: categories.map(c => ({
                name: c.name,
                order: c.order,
                templates: c.templates.map(t => ({
                    name: t.name,
                    defaults: typeof t.defaults === "string" ?
                        JSON.parse(t.defaults) : t.defaults || null
                }))
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="categories-export-${Date.now()}.json"`);
        res.json(exportData);

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Ошибка экспорта категорий" });
    }
});

/* ===============================
   Импорт категорий и шаблонов
=============================== */
router.post("/import", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;
        const { categories, replaceExisting } = req.body;

        if (!categories || !Array.isArray(categories)) {
            return res.status(400).json({ message: "Неверный формат данных" });
        }

        // Если replaceExisting = true, удаляем все существующие категории
        if (replaceExisting) {
            // Удаляем все шаблоны пользователя
            await prisma.template.deleteMany({
                where: { userId }
            });
            // Удаляем все категории пользователя
            await prisma.category.deleteMany({
                where: { userId }
            });
        }

        // Создаём категории и шаблоны из импорта
        for (const cat of categories) {
            if (!cat.name || !cat.name.trim()) {
                continue; // Пропускаем невалидные категории
            }

            // Проверяем, существует ли уже категория с таким именем
            let existingCategory = await prisma.category.findFirst({
                where: { userId, name: cat.name.trim() }
            });

            let category;
            if (existingCategory && !replaceExisting) {
                category = existingCategory;
            } else if (!existingCategory) {
                // Создаём новую категорию
                category = await prisma.category.create({
                    data: {
                        name: cat.name.trim(),
                        order: cat.order || 0,
                        userId
                    }
                });
            }

            // Создаём шаблоны для категории
            if (category && cat.templates && Array.isArray(cat.templates)) {
                for (const tpl of cat.templates) {
                    if (!tpl.name || !tpl.name.trim()) {
                        continue;
                    }

                    // Проверяем, существует ли уже шаблон с таким именем в этой категории
                    const existingTemplate = await prisma.template.findFirst({
                        where: {
                            userId,
                            categoryId: category.id,
                            name: tpl.name.trim()
                        }
                    });

                    if (!existingTemplate) {
                        await prisma.template.create({
                            data: {
                                name: tpl.name.trim(),
                                defaults: tpl.defaults || null,
                                categoryId: category.id,
                                userId
                            }
                        });
                    }
                }
            }
        }

        res.json({ message: "Импорт завершён успешно" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Ошибка импорта категорий" });
    }
});



/* ===============================
   Создать категорию
=============================== */
router.post("/", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Некорректное имя" });
        }

        // Проверка дубля
        const exists = await prisma.category.findFirst({
            where: { userId, name }
        });

        if (exists) {
            return res.status(400).json({ message: "Категория уже существует" });
        }

        const count = await prisma.category.count({ where: { userId } });

        const cat = await prisma.category.create({
            data: {
                name: name.trim(),
                order: count + 1,
                userId
            }
        });

        res.json(await prisma.category.findUnique({
            where: { id: cat.id },
            include: { templates: true }
        }));


    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Ошибка создания категории" });
    }
});

/* ===============================
   Редактировать категорию
=============================== */
router.put("/:id", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;
        const id = Number(req.params.id);
        const { name } = req.body;

        const cat = await prisma.category.findFirst({ where: { id, userId } });
        if (!cat) return res.status(404).json({ message: "Категория не найдена" });

        const updated = await prisma.category.update({
            where: { id },
            data: { name }
        });

        res.json(await prisma.category.findUnique({
            where: { id },
            include: { templates: true }
        }));


    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Ошибка обновления категории" });
    }
});

/* ===============================
   Удалить категорию
=============================== */
router.delete("/:id", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;
        const id = Number(req.params.id);

        console.log("== DELETE CATEGORY ==");
        console.log("User:", userId);
        console.log("Category ID:", id);

        const cat = await prisma.category.findFirst({
            where: { id, userId },
            include: { templates: true }
        });

        console.log("Found category:", cat);

        if (!cat) {
            console.log("Category NOT found!");
            return res.status(404).json({ message: "Категория не найдена" });
        }

        console.log("Deleting templates...");
        await prisma.template.deleteMany({ where: { categoryId: id } });

        console.log("Deleting category...");
        await prisma.category.delete({ where: { id } });

        console.log("DONE!");

        res.json({ message: "Категория удалена" });

    } catch (e) {
        console.error("DELETE ERROR:", e);
        res.status(500).json({ message: "Ошибка удаления категории" });
    }
});

/* =====================================
   Создать шаблон
===================================== */
router.post("/:categoryId/template", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;
        const categoryId = Number(req.params.categoryId);
        const { name, defaults } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Некорректное имя шаблона" });
        }

        // Проверка принадлежности категории
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId }
        });

        if (!category) {
            return res.status(404).json({ message: "Категория не найдена" });
        }

        // Создаём шаблон
        const tpl = await prisma.template.create({
            data: {
                name: name.trim(),
                defaults: defaults || null, // JSON хранится корректно
                categoryId,
                userId
            }
        });

        res.json(tpl);

    } catch (e) {
        console.error("TEMPLATE ERROR:", e);
        res.status(500).json({ message: "Ошибка создания шаблона" });
    }
});


/* =====================================
   Обновить шаблон
===================================== */
router.put("/template/:templateId", authMiddleware, async(req, res) => {
    try {
        const { name, defaults } = req.body;
        const templateId = Number(req.params.templateId);

        const tpl = await prisma.template.update({
            where: { id: templateId },
            data: {
                name,
                defaults: defaults ? JSON.stringify(defaults) : null
            }
        });

        res.json(tpl);
        const updatedCategory = await prisma.category.findUnique({
            where: { id: categoryId },
            include: { templates: true }
        });
        res.json(await prisma.category.findUnique({
            where: { id },
            include: { templates: true }
        }));

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Ошибка обновления шаблона" });
    }
});

/* =====================================
   Удалить шаблон
===================================== */
router.delete("/:id", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;
        const id = Number(req.params.id);

        const cat = await prisma.category.findFirst({
            where: { id, userId },
            include: { templates: true }
        });

        if (!cat) {
            return res.status(404).json({ message: "Категория не найдена" });
        }

        // Удаляем все шаблоны этой категории
        await prisma.template.deleteMany({
            where: { categoryId: id }
        });

        // Теперь удаляем категорию
        await prisma.category.delete({
            where: { id }
        });

        res.json({ message: "Категория удалена" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Ошибка удаления категории" });
    }
});

router.delete("/template/:templateId", authMiddleware, async(req, res) => {
    try {
        const userId = req.user.userId;
        const templateId = Number(req.params.templateId);

        // проверяем что шаблон принадлежит пользователю
        const tpl = await prisma.template.findFirst({
            where: { id: templateId, userId }
        });

        if (!tpl) {
            return res.status(404).json({ message: "Шаблон не найден" });
        }

        await prisma.template.delete({
            where: { id: templateId }
        });

        res.json({ message: "Шаблон удалён" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Ошибка удаления шаблона" });
    }
});




export default router;