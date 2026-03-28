import { Hono } from "hono";
import type { ApiResponse, User } from "@rearden/types";
import { db } from "../lib/db.js";
import { toUser } from "../lib/mappers.js";

export const userRoutes = new Hono();

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
