import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

        const newUser = await prisma.user.create({
            data: { email, password: hashedPassword }
        });

        res.json({ message: "Регистрация успешна", userId: newUser.id });
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

export const changeEmail = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { newEmail, password } = req.body;

        if (!newEmail || !password) {
            return res.status(400).json({ error: "Необходимо указать новый email и пароль" });
        }

        // Получаем текущего пользователя
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "Неверный пароль" });
        }

        // Проверяем, не занят ли новый email
        const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });

        if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({ error: "Этот email уже используется" });
        }

        // Обновляем email
        await prisma.user.update({
            where: { id: userId },
            data: { email: newEmail }
        });

        res.json({ message: "Email успешно изменен" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

export const changePassword = async(req, res) => {
    try {
        const userId = req.user.userId;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "Необходимо указать старый и новый пароль" });
        }

        // Получаем текущего пользователя
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        // Проверяем старый пароль
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "Неверный старый пароль" });
        }

        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: "Пароль успешно изменен" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};