import express from "express";
import auth from "../middlewares/authMiddleware.js";
import {
    saveQuote,
    getMyQuotes,
    getQuoteById,
    deleteQuoteById,
    getQuoteVersions,
    getQuoteVersion,
    compareQuoteVersions,
    restoreQuoteVersion
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

// Version management routes
// Get all versions of a quote
router.get("/:id/versions", auth, getQuoteVersions);

// Get specific version
router.get("/:id/versions/:versionNum", auth, getQuoteVersion);

// Compare two versions
router.get("/:id/compare", auth, compareQuoteVersions);

// Restore a specific version
router.post("/:id/versions/:versionNum/restore", auth, restoreQuoteVersion);

export default router;