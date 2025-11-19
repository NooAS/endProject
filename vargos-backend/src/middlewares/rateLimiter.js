import rateLimit from "express-rate-limit";

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Слишком много запросов с этого IP, попробуйте позже",
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication routes - 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Слишком много попыток. Пожалуйста, подождите 15 минут и попробуйте снова",
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for password reset - 3 requests per hour
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: "Слишком много запросов на восстановление пароля. Попробуйте через час",
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for PDF generation - 20 per 15 minutes
 */
export const pdfLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: "Слишком много запросов на генерацию PDF. Попробуйте позже",
    standardHeaders: true,
    legacyHeaders: false,
});
