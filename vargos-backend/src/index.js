import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import categoryRoutes from "./routes/categoryRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";



dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware для безопасности
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting для защиты от DDoS и brute-force атак
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP за 15 минут
    message: "Слишком много запросов с этого IP, попробуйте позже",
    standardHeaders: true,
    legacyHeaders: false,
});

// Применяем rate limiter ко всем маршрутам
app.use(limiter);

// Middleware для сжатия ответов
app.use(compression());

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит для больших смет
app.use(express.static("public", {
    maxAge: '1d', // Кэшируем статические файлы на 1 день
    etag: true
}));



app.use("/categories", categoryRoutes);
app.use("/jobs", jobRoutes);
app.use("/auth", authRoutes);
app.use("/quotes", quoteRoutes);


app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});