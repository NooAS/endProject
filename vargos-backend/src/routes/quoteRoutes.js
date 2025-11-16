import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Сохранение сметы — ТОЛЬКО авторизованным
router.post("/save", authMiddleware, async(req, res) => {
    const { data } = req.body;

    // вместо БД временно просто вернём ответ
    res.json({
        message: "Смета сохранена",
        userId: req.user.userId,
        data
    });
});

// Получить список сохранённых смет
router.get("/my", authMiddleware, async(req, res) => {
    res.json({
        userId: req.user.userId,
        quotes: []
    });
});

export default router;