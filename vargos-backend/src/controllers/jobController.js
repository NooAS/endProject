import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Получить работы пользователя
export const getJobs = async(req, res) => {
    try {
        const userId = req.user.userId;

        const jobs = await prisma.job.findMany({
            where: { userId },
            include: { category: true },
            orderBy: { id: "asc" }
        });

        res.json(jobs);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};

// Создать работу
export const createJob = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { name, unit, price, categoryId } = req.body;

        // Проверяем, что категория принадлежит пользователю
        const cat = await prisma.category.findFirst({
            where: { id: categoryId, userId }
        });

        if (!cat) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const job = await prisma.job.create({
            data: { name, unit, price, categoryId, userId }
        });

        res.json(job);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
};