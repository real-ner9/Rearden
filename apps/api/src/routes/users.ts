import { Hono } from "hono";
import type { ApiResponse, User } from "@rearden/types";
import { db } from "../lib/db.js";
import { toUser } from "../lib/mappers.js";
import { verifyToken } from "../lib/auth.js";

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

  const userData = toUser(row);

  // Optional auth: resolve isFollowing if authenticated and viewing another user
  const header = c.req.header("Authorization");
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      if (payload.userId !== id) {
        const follow = await db.follow.findUnique({
          where: { followerId_followingId: { followerId: payload.userId, followingId: id } },
        });
        userData.isFollowing = !!follow;
      }
    } catch {
      // Invalid token — just skip isFollowing
    }
  }

  return c.json<ApiResponse<User>>({
    success: true,
    data: userData,
  });
});
