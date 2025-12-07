import express from "express";
import auth from "../middlewares/authMiddleware.js";
import {
    saveQuote,
    getMyQuotes,
    getQuoteById,
    deleteQuoteById,
    updateQuoteStatus,
    getQuotesByStatus,
    getQuoteVersions
} from "../controllers/quoteController.js";

const router = express.Router();

// создать или обновить
router.post("/save", auth, saveQuote);

// история
router.get("/my", auth, getMyQuotes);

// get quotes by status
router.get("/status/:status", auth, getQuotesByStatus);

// get all versions of a quote by name
router.get("/versions/:name", auth, getQuoteVersions);

// update quote status
router.patch("/:id/status", auth, updateQuoteStatus);

// загрузить одну
router.get("/:id", auth, getQuoteById);

// удалить
router.delete("/:id", auth, deleteQuoteById);

export default router;