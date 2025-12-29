import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller";
import { isAuth } from "../middleware/auth";

const router = Router();

router.get("/me", isAuth, getCurrentUser);

export default router;
