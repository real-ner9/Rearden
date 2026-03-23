import { Hono } from "hono";
import type { ApiResponse, Post } from "@rearden/types";
import { db } from "../lib/db.js";

export const postRoutes = new Hono();

function toPost(row: any): Post {
  return {
    id: row.id,
    candidateId: row.candidateId,
    content: row.content,
    hashtags: row.hashtags,
    imageUrl: row.imageUrl ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /api/posts?candidateId=:id
postRoutes.get("/", async (c) => {
  const candidateId = c.req.query("candidateId");

  const rows = await db.post.findMany({
    where: candidateId ? { candidateId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return c.json<ApiResponse<Post[]>>({
    success: true,
    data: rows.map(toPost),
  });
});

// POST /api/posts
postRoutes.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const hashtags =
      (body.content as string)
        .match(/#(\w+)/g)
        ?.map((tag: string) => tag.slice(1).toLowerCase()) ?? [];

    const row = await db.post.create({
      data: {
        candidateId: body.candidateId,
        content: body.content,
        hashtags,
        imageUrl: body.imageUrl ?? null,
      },
    });

    return c.json<ApiResponse<Post>>(
      { success: true, data: toPost(row) },
      201,
    );
  } catch {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid request body" },
      400,
    );
  }
});
