import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import categoryRoutes from "./routes/categoryRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";



dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));



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