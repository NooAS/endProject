import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async(req, res) => {
    try {
        const { name, unit, price, categoryId } = req.body;

        const job = await prisma.job.create({
            data: { name, unit, price, categoryId }
        });

        res.json(job);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;