import express from "express";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import cors from 'cors'
import experienceRoutes from "./routes/experience.routes";
import upvoteRoutes from "./routes/upvote.routes";
import commentRoutes from "./routes/comment.routes";
import healthRoutes from "./routes/health.routes";

const app = express();
app.use(cors({
    origin: "*"
}))
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/upvotes", upvoteRoutes);
app.use("/api/comments", commentRoutes);
app.use("/health", healthRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
