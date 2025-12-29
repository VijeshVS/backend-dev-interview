import prisma from "../config/db";
import { Request, Response } from "express";

// Add comment to experience
export const addComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const experienceId = Number(req.params.id);
    const { comment_text } = req.body;

    if (!comment_text?.trim()) {
      return res.status(400).json({ message: "comment_text required" });
    }

    const comment = await prisma.comments.create({
      data: {
        user_id: userId,
        experience_id: experienceId,
        comment_text
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({ success: true, data: comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get comments for experience
export const getComments = async (req: Request, res: Response) => {
  try {
    const experienceId = Number(req.params.id);

    const comments = await prisma.comments.findMany({
      where: { experience_id: experienceId },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { created_at: "desc" }
    });

    res.json({ success: true, data: comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete comment - only owner can delete
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const commentId = Number(req.params.commentId);

    const comment = await prisma.comments.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ message: "Not found" });

    if (comment.user_id !== userId)
      return res.status(403).json({ message: "Forbidden" });

    await prisma.comments.delete({ where: { id: commentId } });

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
