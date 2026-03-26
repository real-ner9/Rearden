import { Hono } from "hono";
import type { ApiResponse, User } from "@rearden/types";
import { db } from "../lib/db.js";

export const userRoutes = new Hono();

function toUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    username: row.username ?? null,
    onboarded: row.onboarded,
    email: row.email ?? null,
    name: row.name ?? null,
    skills: row.skills ?? [],
    topSkills: row.topSkills ?? [],
    experience: row.experience ?? 0,
    videoUrl: row.videoUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    resumeUrl: row.resumeUrl ?? null,
    resumeText: row.resumeText ?? null,
    resume: row.resume ?? null,
    location: row.location ?? "",
    title: row.title ?? "",
    bio: row.bio ?? "",
    availability: row.availability ?? "immediate",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/users - Get all users
userRoutes.get("/", async (c) => {
  const rows = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json<ApiResponse<User[]>>({
    success: true,
    data: rows.map(toUser),
  });
});

// GET /api/users/:id - Get user by ID
userRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await db.user.findUnique({ where: { id } });

  if (!row) {
    return c.json<ApiResponse>(
      { success: false, error: "User not found" },
      404,
    );
  }

  return c.json<ApiResponse<User>>({
    success: true,
    data: toUser(row),
  });
});
