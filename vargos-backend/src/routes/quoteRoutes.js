import express from "express";
import auth from "../middlewares/authMiddleware.js";
import {
    saveQuote,
    getMyQuotes,
    getQuoteById,
    deleteQuoteById,
    getQuoteVersions,
    compareQuoteVersions
} from "../controllers/quoteController.js";

const router = express.Router();

// создать или обновить
router.post("/save", auth, saveQuote);

// история
router.get("/my", auth, getMyQuotes);

// загрузить одну
router.get("/:id", auth, getQuoteById);

// удалить
router.delete("/:id", auth, deleteQuoteById);

// получить версии сметы
router.get("/:id/versions", auth, getQuoteVersions);

// сравнить версии
router.get("/:id/compare", auth, compareQuoteVersions);

export default router;