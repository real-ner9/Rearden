import { Hono } from "hono";
import type {
  ApiResponse,
  PeopleSearchResponse,
  PeopleSearchResult,
} from "@rearden/types";
import { db } from "../lib/db.js";

export const searchPeopleRoutes = new Hono();

// GET / - People search
searchPeopleRoutes.get("/", async (c) => {
  try {
    const query = c.req.query("q");
    const limit = Math.min(Number(c.req.query("limit")) || 30, 60);
    const offset = Math.max(Number(c.req.query("offset")) || 0, 0);

    let where: any = {
      onboarded: true,
    };

    // If query provided, search username and name
    if (query && query.trim()) {
      const trimmedQuery = query.trim();
      where.OR = [
        {
          username: {
            contains: trimmedQuery,
            mode: "insensitive" as const,
          },
        },
        {
          name: {
            contains: trimmedQuery,
            mode: "insensitive" as const,
          },
        },
      ];
    }

    // Fetch users
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        title: true,
        thumbnailUrl: true,
        location: true,
      },
      orderBy: { createdAt: "desc" as const },
      take: limit,
      skip: offset,
    });

    // Count total
    const total = await db.user.count({ where });

    // Map to PeopleSearchResult
    const results: PeopleSearchResult[] = users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      title: user.title,
      thumbnailUrl: user.thumbnailUrl,
      location: user.location,
    }));

    return c.json<ApiResponse<PeopleSearchResponse>>({
      success: true,
      data: {
        users: results,
        total,
      },
    });
  } catch (error) {
    console.error("People search error:", error);
    return c.json<ApiResponse>(
      { success: false, error: "Failed to search people" },
      500
    );
  }
});
