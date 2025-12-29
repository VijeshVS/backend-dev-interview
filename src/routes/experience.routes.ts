import { Router } from "express";
import { isAuth } from "../middleware/auth";
import {
  createExperience,
  getExperiences,
  getExperienceById,
  updateExperience,
  deleteExperience
} from "../controllers/experience.controller";
import { getMyExperiences } from "../controllers/experience.controller";

const router = Router();

router.get("/", getExperiences);
router.get("/mine", isAuth, getMyExperiences);
router.get("/:id", getExperienceById);
router.post("/", isAuth, createExperience);
router.put("/:id", isAuth, updateExperience);
router.delete("/:id", isAuth, deleteExperience);

export default router;
