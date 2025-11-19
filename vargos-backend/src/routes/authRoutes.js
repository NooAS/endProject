import express from "express";
import { register, login, changeEmail, changePassword } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-email", authMiddleware, changeEmail);
router.post("/change-password", authMiddleware, changePassword);

export default router;