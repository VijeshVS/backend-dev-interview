import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { signToken } from "../utils/jwt";
import { Request, Response } from "express";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ message: "Email already used" });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: { name, email, password_hash: hash },
      select: { id: true, name: true, email: true, created_at: true }
    });

    const token = signToken(user.id);

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
