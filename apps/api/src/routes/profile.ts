import { Hono } from "hono";
import type { ApiResponse, User } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";
import { toUser } from "../lib/mappers.js";

type AuthEnv = { Variables: { userId: string } };

export const profileRoutes = new Hono<AuthEnv>();

profileRoutes.use("*", authMiddleware);

// GET /api/me/profile — get current user's profile
profileRoutes.get("/", async (c) => {
  const userId = c.get("userId");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return c.json<ApiResponse>(
      { success: false, error: "User not found" },
      404,
    );
  }

  return c.json<ApiResponse<User>>({
    success: true,
    data: toUser(user),
  });
});

// PUT /api/me/profile — update profile fields
profileRoutes.put("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return c.json<ApiResponse>(
      { success: false, error: "User not found" },
      404,
    );
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      name: body.name ?? user.name,
      email: body.email ?? user.email,
      title: body.title ?? user.title,
      location: body.location ?? user.location,
      bio: body.bio ?? user.bio,
      experience: body.experience ?? user.experience,
      availability: body.availability ?? user.availability,
      thumbnailUrl: body.thumbnailUrl !== undefined ? body.thumbnailUrl : user.thumbnailUrl,
      videoUrl: body.videoUrl !== undefined ? body.videoUrl : user.videoUrl,
      resumeUrl: body.resumeUrl !== undefined ? body.resumeUrl : user.resumeUrl,
    },
  });

  return c.json<ApiResponse<User>>({
    success: true,
    data: toUser(updated),
  });
});

// PUT /api/me/profile/skills — save top skills order
profileRoutes.put("/skills", async (c) => {
  const userId = c.get("userId");
  const { skills } = await c.req.json<{ skills: string[] }>();

  const topSkills = (skills ?? []).slice(0, 13);

  const updated = await db.user.update({
    where: { id: userId },
    data: { topSkills },
  });

  return c.json<ApiResponse<{ topSkills: string[] }>>({
    success: true,
    data: { topSkills: updated.topSkills },
  });
});

// GET /api/me/profile/skills/all — all unique hashtags from user's posts
profileRoutes.get("/skills/all", async (c) => {
  const userId = c.get("userId");

  const posts = await db.post.findMany({
    where: { userId },
    select: { hashtags: true },
  });

  const allHashtags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.hashtags) {
      allHashtags.add(tag);
    }
  }

  return c.json<ApiResponse<{ skills: string[] }>>({
    success: true,
    data: { skills: Array.from(allHashtags) },
  });
});
