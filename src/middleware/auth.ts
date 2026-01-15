import { verifyToken } from "../utils/jwt";
import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token) as { userId: number };
    (req as any).user = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Optional auth - sets user if token is present but doesn't fail if not
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Continue without setting user
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token) as { userId: number };
    (req as any).user = decoded.userId;
    //@ts-ignore
    next();
  } catch {
    // Invalid token, but continue anyway (optional auth)
    next();
  }
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    (req as any).role = user.role;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
