import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";

const prisma = new PrismaClient();

export const register = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Проверка на существующего пользователя
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Пользователь уже существует" });
        }

        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Генерируем токен для подтверждения email
        const verificationToken = uuidv4();

        const newUser = await prisma.user.create({
            data: { 
                email, 
                password: hashedPassword,
                verificationToken,
                isVerified: false
            }
        });

        // Отправляем письмо для подтверждения
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error("Error sending verification email:", emailError);
            // Продолжаем регистрацию даже если письмо не отправилось
        }

        res.json({ 
            message: "Регистрация успешна. Проверьте вашу почту для подтверждения email.", 
            userId: newUser.id 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

export const login = async(req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ error: "Неверный email или пароль" });
        }

        // Проверяем, подтвержден ли email
        if (!user.isVerified) {
            return res.status(403).json({ 
                error: "Email не подтвержден. Проверьте вашу почту.",
                needsVerification: true 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "Неверный email или пароль" });
        }

        // Создаём JWT токен
        const token = jwt.sign({ userId: user.id },
            process.env.JWT_SECRET, { expiresIn: "7d" }
        );

        res.json({ message: "Успешный вход", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

/**
 * Verify user email with token
 */
export const verifyEmail = async(req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: "Токен не предоставлен" });
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token }
        });

        if (!user) {
            return res.status(400).json({ error: "Неверный или истекший токен" });
        }

        if (user.isVerified) {
            return res.json({ message: "Email уже подтвержден" });
        }

        // Подтверждаем email
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null
            }
        });

        res.json({ message: "Email успешно подтвержден. Теперь вы можете войти." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

/**
 * Request password reset - sends email with reset token
 */
export const requestPasswordReset = async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email не предоставлен" });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Не раскрываем, существует ли пользователь
        if (!user) {
            return res.json({ 
                message: "Если пользователь с таким email существует, письмо для восстановления пароля было отправлено." 
            });
        }

        // Генерируем токен для сброса пароля
        const resetToken = uuidv4();
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 час

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // Отправляем письмо
        try {
            await sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
            console.error("Error sending password reset email:", emailError);
        }

        res.json({ 
            message: "Если пользователь с таким email существует, письмо для восстановления пароля было отправлено." 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

/**
 * Reset password with token
 */
export const resetPassword = async(req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Токен и новый пароль обязательны" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Пароль должен быть не менее 6 символов" });
        }

        const user = await prisma.user.findUnique({
            where: { resetToken: token }
        });

        if (!user) {
            return res.status(400).json({ error: "Неверный или истекший токен" });
        }

        // Проверяем, не истек ли токен
        if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
            return res.status(400).json({ error: "Токен истек. Запросите новый." });
        }

        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль и удаляем токен
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: "Пароль успешно изменен. Теперь вы можете войти с новым паролем." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};