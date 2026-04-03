import { Hono } from "hono";
import type { ApiResponse } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";

export const likeRoutes = new Hono();

// POST /api/posts/:postId/like
likeRoutes.post("/:postId/like", authMiddleware, async (c) => {
  const postId = c.req.param("postId");
  const userId = c.get("userId");

  // Check if post exists
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) {
    return c.json<ApiResponse>(
      { success: false, error: "Post not found" },
      404
    );
  }

  // Toggle like
  const existingLike = await db.like.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  let liked: boolean;
  let updatedPost;

  if (existingLike) {
    // Unlike: delete like and decrement counter
    const result = await db.$transaction([
      db.like.delete({
        where: { userId_postId: { userId, postId } },
      }),
      db.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    liked = false;
    updatedPost = result[1];
  } else {
    // Like: create like and increment counter
    const result = await db.$transaction([
      db.like.create({
        data: { userId, postId },
      }),
      db.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    liked = true;
    updatedPost = result[1];
  }

  return c.json<ApiResponse<{ liked: boolean; likeCount: number }>>({
    success: true,
    data: { liked, likeCount: updatedPost.likeCount },
  });
});
