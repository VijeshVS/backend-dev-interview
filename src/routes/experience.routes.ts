import { Router } from "express";
import { isAuth, isAdmin, optionalAuth } from "../middleware/auth";
import {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience,
  getMyExperiences,
  getPendingExperiences,
  updateExperienceStatus,
  deleteAnyExperience,
  getAllExperiences,
} from "../controllers/experience.controller";

const router = Router();

router.get("/", getExperiences);
router.get("/mine", isAuth, getMyExperiences);
router.get("/:id", optionalAuth, getExperienceById);
router.post("/", isAuth, createExperience);
router.put("/:id", isAuth, updateExperience);
router.delete("/:id", isAuth, deleteExperience);

// Admin routes
router.get("/admin/pending", isAuth, isAdmin, getPendingExperiences);
router.get("/admin/all", isAuth, isAdmin, getAllExperiences);
router.put("/admin/:id/status", isAuth, isAdmin, updateExperienceStatus);
router.delete("/admin/:id", isAuth, isAdmin, deleteAnyExperience);

export default router;
