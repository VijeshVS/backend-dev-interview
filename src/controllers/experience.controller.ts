import prisma from "../config/db";
import { Request, Response } from "express";

async function getFullExperience(id: number, userId?: number) {
  if(!id) id = 0
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

    // Only return approved experiences for normal users
    const items = await prisma.experiences.findMany({
      where: {
        status: "APPROVED"
      },
      take: limit,
      skip: offset,
      orderBy: { created_at: "desc" }
    });

    const total = await prisma.experiences.count({
      where: {
        status: "APPROVED"
      }
    });

    res.json({ success: true, limit, offset, items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getExperienceById = async (req: Request, res: Response) => {
  try {
    const experienceId = Number(req.params.id);
    const userId = (req as any).user; // May be undefined if not authenticated
    
    const exp = await getFullExperience(experienceId);
    if (!exp) return res.status(404).json({ message: "Not found" });

    // Check if user is the owner of this experience
    const isOwner = userId && Number(exp.user_id) === Number(userId);
    const isApproved = exp.status === "APPROVED";

    // Allow access if:
    // 1. User is the owner (can view their own experience regardless of status)
    // 2. Experience is approved (anyone can view approved experiences)
    if (isOwner || isApproved) {
      return res.json({ success: true, data: exp });
    }

    // Block access if not owner and not approved
    return res.status(403).json({ 
      message: "This experience is not available for viewing" 
    });
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
    if (Number(exists.user_id) !== Number(userId)) return res.status(403).json({ message: "Forbidden" });

    await prisma.experiences.delete({ where: { id } });

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all experiences created by logged-in user
export const getMyExperiences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const experiences = await prisma.experiences.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        title: true,
        company_name: true,
        created_at: true,
        status: true,
        rounds_count: true
      }
    });

    return res.json({
      success: true,
      count: experiences.length,
      data: experiences
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Admin-specific methods

export const getPendingExperiences = async (req: Request, res: Response) => {
  try {
    const experiences = await prisma.experiences.findMany({
      where: { status: "PENDING" },
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({
      success: true,
      data: experiences,
      count: experiences.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending experiences", error });
  }
};

export const updateExperienceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedExperience = await prisma.experiences.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json({ success: true, data: updatedExperience });
  } catch (error) {
    res.status(500).json({ message: "Error updating experience status", error });
  }
};

export const deleteAnyExperience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.experiences.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true, message: "Experience deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting experience", error });
  }
};

export const getAllExperiences = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;

    const experiences = await prisma.experiences.findMany({
      take: limit,
      skip: offset,
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const total = await prisma.experiences.count();

    res.json({
      success: true,
      data: experiences,
      total,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching experiences", error });
  }
};
