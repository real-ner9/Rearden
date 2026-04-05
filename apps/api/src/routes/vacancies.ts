import { Hono } from "hono";
import type { ApiResponse, Vacancy, VacancyDetail } from "@rearden/types";
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

// GET /api/vacancies?userId=:id&limit=&offset=
vacancyRoutes.get("/", async (c) => {
  const userId = c.req.query("userId");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  const offset = Number(c.req.query("offset")) || 0;

  const rows = await db.vacancy.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return c.json<ApiResponse<Vacancy[]>>({
    success: true,
    data: rows.map(toVacancy),
  });
});

// GET /api/vacancies/:id — single vacancy with author
vacancyRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const row = await db.vacancy.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true, thumbnailUrl: true, title: true } },
    },
  });
  if (!row) return c.json<ApiResponse>({ success: false, error: "Vacancy not found" }, 404);
  return c.json<ApiResponse<VacancyDetail>>({ success: true, data: { ...toVacancy(row), author: row.user } });
});

// POST /api/vacancies
vacancyRoutes.post("/", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();

    const row = await db.vacancy.create({
      data: {
        userId,
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
