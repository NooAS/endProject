import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// Регистрация
router.post("/register", register);

// Логин
router.post("/login", login);

export default router;