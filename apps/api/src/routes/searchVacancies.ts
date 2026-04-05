import { Hono } from "hono";
import type {
  ApiResponse,
  VacancySearchResponse,
  VacancySearchResult,
} from "@rearden/types";
import { db } from "../lib/db.js";

export const searchVacanciesRoutes = new Hono();

// GET / - Vacancy search
searchVacanciesRoutes.get("/", async (c) => {
  try {
    const query = c.req.query("q");
    const typeFilter = c.req.query("type");
    const locationFilter = c.req.query("location");
    const limit = Math.min(Number(c.req.query("limit")) || 20, 60);
    const offset = Math.max(Number(c.req.query("offset")) || 0, 0);

    let where: any = {};

    // Keyword search on title and description
    if (query && query.trim()) {
      const trimmedQuery = query.trim();
      where.OR = [
        {
          title: {
            contains: trimmedQuery,
            mode: "insensitive" as const,
          },
        },
        {
          description: {
            contains: trimmedQuery,
            mode: "insensitive" as const,
          },
        },
      ];
    }

    // Type filter (exact match)
    if (typeFilter) {
      where.type = typeFilter;
    }

    // Location filter (contains, case-insensitive)
    if (locationFilter && locationFilter.trim()) {
      where.location = {
        contains: locationFilter.trim(),
        mode: "insensitive" as const,
      };
    }

    // Parallel execution: fetch vacancies and count total
    const [vacancies, total] = await Promise.all([
      db.vacancy.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              thumbnailUrl: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" as const },
        take: limit,
        skip: offset,
      }),
      db.vacancy.count({ where }),
    ]);

    // Map to VacancySearchResult
    const results: VacancySearchResult[] = vacancies.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      type: row.type as VacancySearchResult["type"],
      location: row.location,
      createdAt: row.createdAt.toISOString(),
      author: row.user,
    }));

    return c.json<ApiResponse<VacancySearchResponse>>({
      success: true,
      data: {
        vacancies: results,
        total,
      },
    });
  } catch (error) {
    console.error("Vacancy search error:", error);
    return c.json<ApiResponse>(
      { success: false, error: "Failed to search vacancies" },
      500
    );
  }
});
