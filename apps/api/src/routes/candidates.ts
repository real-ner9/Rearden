import { Hono } from "hono";
import type { ApiResponse, Candidate } from "@rearden/types";
import { db } from "../lib/db.js";

export const candidateRoutes = new Hono();

function toCandidate(row: any): Candidate {
  return {
    ...row,
    role: "candidate" as const,
    resume: row.resume ?? null,
    resumeUrl: row.resumeUrl ?? null,
    resumeText: row.resumeText ?? null,
    videoUrl: row.videoUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/candidates - Get all candidates
candidateRoutes.get("/", async (c) => {
  const rows = await db.candidate.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json<ApiResponse<Candidate[]>>({
    success: true,
    data: rows.map(toCandidate),
  });
});

// GET /api/candidates/:id - Get candidate by ID
candidateRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await db.candidate.findUnique({ where: { id } });

  if (!row) {
    return c.json<ApiResponse>(
      { success: false, error: "Candidate not found" },
      404,
    );
  }

  return c.json<ApiResponse<Candidate>>({
    success: true,
    data: toCandidate(row),
  });
});

// POST /api/candidates - Create new candidate
candidateRoutes.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const row = await db.candidate.create({
      data: {
        email: body.email,
        name: body.name,
        skills: body.skills ?? [],
        experience: body.experience ?? 0,
        videoUrl: body.videoUrl ?? null,
        thumbnailUrl: body.thumbnailUrl ?? null,
        resumeUrl: body.resumeUrl ?? null,
        resumeText: body.resumeText ?? null,
        location: body.location ?? "",
        title: body.title ?? "",
        bio: body.bio ?? "",
        availability: body.availability ?? "immediate",
      },
    });

    return c.json<ApiResponse<Candidate>>(
      { success: true, data: toCandidate(row) },
      201,
    );
  } catch {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid request body" },
      400,
    );
  }
});
