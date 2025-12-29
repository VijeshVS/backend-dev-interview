import prisma from "../config/db";
import { Request, Response } from "express";

// Toggle Upvote (if already exists → remove)
export const toggleUpvote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const experienceId = Number(req.params.id);

    const existing = await prisma.experience_Upvotes.findUnique({
      where: {
        user_id_experience_id: { user_id: userId, experience_id: experienceId }
      }
    });

    if (existing) {
      await prisma.experience_Upvotes.delete({
        where: {
          user_id_experience_id: { user_id: userId, experience_id: experienceId }
        }
      });
      return res.json({ success: true, upvoted: false });
    }

    await prisma.experience_Upvotes.create({
      data: { user_id: userId, experience_id: experienceId }
    });

    return res.json({ success: true, upvoted: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get upvote count for experience
export const getUpvoteCount = async (req: Request, res: Response) => {
  try {
    const experienceId = Number(req.params.id);

    const count = await prisma.experience_Upvotes.count({
      where: { experience_id: experienceId }
    });

    res.json({ success: true, count });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Check if user already upvoted
export const isUpvotedByUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const experienceId = Number(req.params.id);

    const exists = await prisma.experience_Upvotes.findUnique({
      where: {
        user_id_experience_id: {
          user_id: userId,
          experience_id: experienceId
        }
      }
    });

    res.json({ success: true, upvoted: !!exists });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
