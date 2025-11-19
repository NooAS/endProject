import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 */
export const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Подтверждение регистрации - Vargos",
        html: `
            <h2>Добро пожаловать в Vargos!</h2>
            <p>Спасибо за регистрацию. Пожалуйста, подтвердите ваш email адрес, нажав на ссылку ниже:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
                Подтвердить Email
            </a>
            <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
            <p>${verificationUrl}</p>
            <p>Ссылка действительна в течение 24 часов.</p>
            <br>
            <p>Если вы не регистрировались на нашем сайте, проигнорируйте это письмо.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Не удалось отправить письмо для подтверждения");
    }
};

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} token - Reset token
 */
export const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Восстановление пароля - Vargos",
        html: `
            <h2>Запрос на восстановление пароля</h2>
            <p>Вы запросили восстановление пароля. Нажмите на ссылку ниже, чтобы создать новый пароль:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">
                Сбросить пароль
            </a>
            <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
            <p>${resetUrl}</p>
            <p>Ссылка действительна в течение 1 часа.</p>
            <br>
            <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Не удалось отправить письмо для восстановления пароля");
    }
};
