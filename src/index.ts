import express from "express";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import cors from 'cors'
import experienceRoutes from "./routes/experience.routes";

const app = express();
app.use(cors({
    origin: "*"
}))
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/api/experiences", experienceRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
