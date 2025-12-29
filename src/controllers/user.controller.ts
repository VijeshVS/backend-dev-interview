import prisma from "../config/db";
import { Request, Response } from "express";

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, created_at: true }
    });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
