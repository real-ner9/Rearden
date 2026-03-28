import { Hono } from "hono";
import type { ApiResponse, Vacancy } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";

type AuthEnv = { Variables: { userId: string } };

export const vacancyRoutes = new Hono<AuthEnv>();

function toVacancy(row: any): Vacancy {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    type: row.type as Vacancy["type"],
    location: row.location,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /api/vacancies?userId=:id
vacancyRoutes.get("/", async (c) => {
  const userId = c.req.query("userId");

  const rows = await db.vacancy.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return c.json<ApiResponse<Vacancy[]>>({
    success: true,
    data: rows.map(toVacancy),
  });
});

// POST /api/vacancies
vacancyRoutes.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();

    const row = await db.vacancy.create({
      data: {
        userId: body.userId,
        title: body.title,
        description: body.description,
        type: body.type ?? "fulltime",
        location: body.location ?? "",
      },
    });

    return c.json<ApiResponse<Vacancy>>(
      { success: true, data: toVacancy(row) },
      201,
    );
  } catch {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid request body" },
      400,
    );
  }
});
