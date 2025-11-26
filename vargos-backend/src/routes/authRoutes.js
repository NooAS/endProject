import express from "express";
import { register, login, changeEmail, changePassword, getDefaultCompanyData, saveDefaultCompanyData } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-email", authMiddleware, changeEmail);
router.post("/change-password", authMiddleware, changePassword);
router.get("/company-data", authMiddleware, getDefaultCompanyData);
router.post("/company-data", authMiddleware, saveDefaultCompanyData);

export default router;