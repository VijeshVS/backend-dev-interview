import prisma from "../config/db";
import { Request, Response } from "express";

async function getFullExperience(id: number, userId?: number) {
  return prisma.experiences.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      rounds: {
        orderBy: { round_order: "asc" },
        include: {
          codingProblems: true,
          technicalQuestions: true
        }
      }
    }
  });
}

export const createExperience = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      title,
      company_name,
      package_ctc,
      role,
      job_type,
      difficulty_level,
      rounds = []
    } = req.body;

    if (!title || !company_name)
      return res.status(400).json({ message: "title & company_name required" });

    const experience = await prisma.experiences.create({
      data: {
        user_id: userId,
        title,
        company_name,
        package_ctc,
        role,
        job_type,
        difficulty_level,
        rounds_count: rounds.length,
        rounds: {
          create: rounds.map((r: any) => ({
            round_order: r.round_order,
            round_name: r.round_name,
            description: r.description,
            codingProblems: {
              create: (r.coding_problems || []).map((p: any) => ({
                title: p.title,
                link: p.link,
                description: p.description,
                constraints: p.constraints,
                sample_testcases: p.sample_testcases
              }))
            },
            technicalQuestions: {
              create: (r.technical_questions || []).map((q: any) => ({
                question_text: q.question_text,
                answer_text: q.answer_text
              }))
            }
          }))
        }
      }
    });

    const full = await getFullExperience(experience.id);
    return res.status(201).json({ success: true, data: full });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getExperiences = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const items = await prisma.experiences.findMany({});

    res.json({ success: true, limit, offset, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getExperienceById = async (req: Request, res: Response) => {
  try {
    const exp = await getFullExperience(Number(req.params.id));
    if (!exp) return res.status(404).json({ message: "Not found" });

    return res.json({ success: true, data: exp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update experience only if owner
export const updateExperience = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const id = Number(req.params.id);

    const exists = await prisma.experiences.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ message: "Not found" });
    if (exists.user_id !== userId) return res.status(403).json({ message: "Forbidden" });

    const {
      title,
      company_name,
      package_ctc,
      role,
      job_type,
      difficulty_level,
      rounds = []
    } = req.body;

    await prisma.experiences.update({
      where: { id },
      data: {
        title,
        company_name,
        package_ctc,
        role,
        job_type,
        difficulty_level,
        rounds_count: rounds.length,
        rounds: {
          deleteMany: { experience_id: id },
          create: rounds.map((r: any) => ({
            round_order: r.round_order,
            round_name: r.round_name,
            description: r.description,
            codingProblems: {
              create: (r.coding_problems || []).map((p: any) => ({
                title: p.title,
                link: p.link,
                description: p.description,
                constraints: p.constraints,
                sample_testcases: p.sample_testcases
              }))
            },
            technicalQuestions: {
              create: (r.technical_questions || []).map((q: any) => ({
                question_text: q.question_text,
                answer_text: q.answer_text
              }))
            }
          }))
        }
      }
    });

    const updated = await getFullExperience(id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete experience only if owner
export const deleteExperience = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const id = Number(req.params.id);

    const exists = await prisma.experiences.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ message: "Not found" });
    if (exists.user_id !== userId) return res.status(403).json({ message: "Forbidden" });

    await prisma.experiences.delete({ where: { id } });

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
