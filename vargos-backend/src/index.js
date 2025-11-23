import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import categoryRoutes from "./routes/categoryRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting to API routes only
app.use("/api/", limiter);
app.use("/auth/", limiter);

// Quote-specific rate limiting
const quoteLimiter = rateLimit({
    windowMs: parseInt(process.env.QUOTE_RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.QUOTE_RATE_LIMIT_MAX) || 50,
    message: "Too many quote operations, please try again later."
});
app.use("/quotes/", quoteLimiter);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Static files with caching
app.use(express.static("public", {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true
}));

// API Routes
app.use("/categories", categoryRoutes);
app.use("/jobs", jobRoutes);
app.use("/auth", authRoutes);
app.use("/quotes", quoteRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        res.json({ 
            status: "ok", 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(503).json({ 
            status: "error", 
            message: "Database connection failed",
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 4000;

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, closing server gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});