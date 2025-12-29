import { Router } from "express";
import { isAuth } from "../middleware/auth";
import {
  addComment,
  getComments,
  deleteComment
} from "../controllers/comment.controller";

const router = Router();

// Public - fetch comments
router.get("/:id", getComments);

// Auth required - write
router.post("/:id", isAuth, addComment);
router.delete("/:commentId", isAuth, deleteComment);

export default router;
