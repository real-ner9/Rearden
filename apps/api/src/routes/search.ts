import { Hono } from "hono";
import type { ApiResponse, User, SearchQuery, SearchResult } from "@rearden/types";
import { db } from "../lib/db.js";
import { searchUsers } from "../lib/searchEngine.js";

export const searchRoutes = new Hono();

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

// POST /api/search - Search users
searchRoutes.post("/", async (c) => {
  try {
    const body = (await c.req.json()) as SearchQuery;
    const { query, filters } = body;

    const startTime = Date.now();

    // Fetch all users from DB
    const rows = await db.user.findMany();
    const users = rows.map(toUser);

    // Perform search using existing engine
    const scoredUsers = searchUsers(users, query, filters);

    const searchTimeMs = Date.now() - startTime;

    const results: (SearchResult & { user: User })[] =
      scoredUsers.map((su) => ({
        userId: su.user.id,
        score: su.score,
        matchReason: su.matchReason,
        user: su.user,
      }));

    return c.json<ApiResponse>({
      success: true,
      data: {
        results,
        query,
        totalUsers: users.length,
        searchTimeMs,
      },
    });
  } catch {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid search request" },
      400,
    );
  }
});
