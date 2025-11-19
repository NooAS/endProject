import express from "express";
import { register, login, verifyEmail, requestPasswordReset, resetPassword } from "../controllers/authController.js";
import { authLimiter, passwordResetLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/verify-email", verifyEmail);
router.post("/request-password-reset", passwordResetLimiter, requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;