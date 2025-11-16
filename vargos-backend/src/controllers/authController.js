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