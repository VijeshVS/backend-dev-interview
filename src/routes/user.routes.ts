import { Router } from "express";
import { getCurrentUser, checkAdmin } from "../controllers/user.controller";
import { isAuth } from "../middleware/auth";

const router = Router();

router.get("/me", isAuth, getCurrentUser);
router.get("/admin/check", isAuth, checkAdmin);

export default router;
