import { Hono } from "hono";
import type { ApiResponse, Vacancy } from "@rearden/types";
import { db } from "../lib/db.js";

export const vacancyRoutes = new Hono();

function toVacancy(row: any): Vacancy {
  return {
    id: row.id,
    candidateId: row.candidateId,
    title: row.title,
    description: row.description,
    type: row.type as Vacancy["type"],
    location: row.location,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /api/vacancies?candidateId=:id
vacancyRoutes.get("/", async (c) => {
  const candidateId = c.req.query("candidateId");

  const rows = await db.vacancy.findMany({
    where: candidateId ? { candidateId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return c.json<ApiResponse<Vacancy[]>>({
    success: true,
    data: rows.map(toVacancy),
  });
});

// POST /api/vacancies
vacancyRoutes.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const row = await db.vacancy.create({
      data: {
        candidateId: body.candidateId,
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
