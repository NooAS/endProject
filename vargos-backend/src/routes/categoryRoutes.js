import { Router } from "express";
import { getCategories, createCategory } from "../controllers/categoryController.js";

const router = Router();

router.get("/", getCategories);
router.post("/", createCategory);

router.get("/my", authMiddleware, async(req, res) => {
    const userId = req.user.userId;

    const categories = await prisma.category.findMany({
        where: { userId },
        orderBy: { order: "asc" }
    });

    res.json(categories);
});

router.post("/", authMiddleware, async(req, res) => {
    const userId = req.user.userId;
    const { name } = req.body;

    const exists = await prisma.category.findFirst({
        where: { userId, name }
    });

    if (exists) {
        return res.status(400).json({ message: "Категория уже существует" });
    }

    const count = await prisma.category.count({ where: { userId } });

    const cat = await prisma.category.create({
        data: {
            name,
            order: count + 1,
            userId
        }
    });

    res.json(cat);
});


export default router;