import { Router } from "express";
import { isAuth } from "../middleware/auth";
import {
  toggleUpvote,
  getUpvoteCount,
  isUpvotedByUser
} from "../controllers/upvote.controller";

const router = Router();

router.post("/:id", isAuth, toggleUpvote);
router.get("/:id/count", getUpvoteCount);
router.get("/:id/status", isAuth, isUpvotedByUser);

export default router;
