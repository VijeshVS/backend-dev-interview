import prisma from "../config/db";
import { Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        user: {
          connect: { id: userId }
      },
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

const SYSTEM_PROMPT = `
You are a strict backend data extraction engine.

Your job:
Convert unstructured or fuzzy interview experience text into a JSON object that can be directly inserted into a database using Prisma.

ABSOLUTE RULES:
- Output ONLY valid JSON
- No markdown, no comments, no explanations
- Do NOT hallucinate facts
- If information is missing, use null or empty arrays
- Follow enum values EXACTLY as defined
- The JSON must match the schema below

-----------------------------------
TARGET JSON SCHEMA
-----------------------------------

{
  "title": string,
  "company_name": string,
  "package_ctc": string,
  "role": string,
  "job_type": "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT" | "OTHER" | null,
  "difficulty_level": "EASY" | "MEDIUM" | "HARD" | "VERY_HARD" | null,
  "rounds": [
    {
      "round_order": number,
      "round_name": string (For eg: technical round, hr round, coding round),
      "description": string,
      "coding_problems": [
        {
          "title": string,
          "link": string | null,
          "description": string | null,
          "constraints": string | null,
          "sample_testcases": string | null
        }
      ],
      "technical_questions": [
        {
          "question_text": string,
          "answer_text": string | null
        }
      ]
    }
  ]
}

-----------------------------------
ENUM INFERENCE RULES
-----------------------------------

JobType:
- full time / permanent / fte → FULL_TIME
- part time → PART_TIME
- intern / internship → INTERNSHIP
- contract → CONTRACT
- anything else unclear → OTHER

DifficultyLevel:
- easy / simple → EASY
- moderate / medium → MEDIUM
- hard / tough → HARD
- very hard / extremely difficult → VERY_HARD

-----------------------------------
ROUND RULES
-----------------------------------
- If rounds are mentioned, extract them in order
- If only a number of rounds is mentioned but no details, create empty rounds with names like "Round 1"
- round_order must start from 1
- If no rounds mentioned, return an empty array

-----------------------------------
TITLE RULES
-----------------------------------
- Max 10 words
- Should summarize company + role + interview
- Example: "Google SDE Internship Interview"

-----------------------------------
FAILURE CONDITION
-----------------------------------
If the input is NOT an interview experience, return:
{
  "title": null,
  "company_name": null,
  "package_ctc": null,
  "role": null,
  "job_type": null,
  "difficulty_level": null,
  "rounds": []
}
`;

export const createFuzzyExperience = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "text is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ]
    });

    let parsed;
    try {
      const raw = completion.choices[0].message.content as string;
      parsed = JSON.parse(raw);
    } catch {
      return res.status(422).json({
        message: "Invalid JSON from model",
        raw: completion.choices[0].message.content
      });
    }

    // Hard validation (don’t trust AI)
    if (!parsed.title || !parsed.company_name || !parsed.package_ctc || !parsed.rounds) {
      return res.status(400).json({
        message: "Could not extract required fields",
        parsed
      });
    }

    // Inject parsed body into existing flow
    req.body = parsed;

    return createExperience(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};