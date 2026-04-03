import { Hono } from "hono";
import type { ApiResponse, PostComment, CreateCommentPayload } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";

export const commentRoutes = new Hono();

// GET /api/posts/:postId/comments
commentRoutes.get("/:postId/comments", async (c) => {
  const postId = c.req.param("postId");
  const cursorParam = c.req.query("cursor");
  const limitParam = c.req.query("limit");

  const limit = Math.min(
    parseInt(limitParam || "30", 10),
    100
  );

  // Check if post exists
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) {
    return c.json<ApiResponse>(
      { success: false, error: "Post not found" },
      404
    );
  }

  // Build cursor filter (oldest first, so createdAt > cursor)
  const cursorFilter = cursorParam
    ? { createdAt: { gt: new Date(cursorParam) } }
    : {};

  // Fetch comments
  const comments = await db.comment.findMany({
    where: { postId, ...cursorFilter },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          thumbnailUrl: true,
        },
      },
    },
  });

  const hasMore = comments.length > limit;
  const items = hasMore ? comments.slice(0, limit) : comments;

  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  const result: PostComment[] = items.map((comment) => ({
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.user.id,
      name: comment.user.name,
      username: comment.user.username,
      thumbnailUrl: comment.user.thumbnailUrl,
    },
  }));

  return c.json<ApiResponse<PostComment[]>>({
    success: true,
    data: result,
    meta: { nextCursor },
  });
});

// POST /api/posts/:postId/comments
commentRoutes.post("/:postId/comments", authMiddleware, async (c) => {
  const postId = c.req.param("postId");
  const userId = c.get("userId");

  const body = await c.req.json<CreateCommentPayload>();

  // Validate text
  if (!body.text || typeof body.text !== "string") {
    return c.json<ApiResponse>(
      { success: false, error: "Comment text is required" },
      400
    );
  }

  const text = body.text.trim();
  if (text.length === 0) {
    return c.json<ApiResponse>(
      { success: false, error: "Comment text cannot be empty" },
      400
    );
  }

  if (text.length > 2000) {
    return c.json<ApiResponse>(
      { success: false, error: "Comment text cannot exceed 2000 characters" },
      400
    );
  }

  // Check if post exists
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) {
    return c.json<ApiResponse>(
      { success: false, error: "Post not found" },
      404
    );
  }

  // Create comment and increment counter in transaction
  const [comment] = await db.$transaction([
    db.comment.create({
      data: { postId, userId, text },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            thumbnailUrl: true,
          },
        },
      },
    }),
    db.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  const result: PostComment = {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.user.id,
      name: comment.user.name,
      username: comment.user.username,
      thumbnailUrl: comment.user.thumbnailUrl,
    },
  };

  return c.json<ApiResponse<PostComment>>({
    success: true,
    data: result,
  });
});

// DELETE /api/posts/:postId/comments/:commentId
commentRoutes.delete("/:postId/comments/:commentId", authMiddleware, async (c) => {
  const postId = c.req.param("postId");
  const commentId = c.req.param("commentId");
  const userId = c.get("userId");

  // Fetch comment
  const comment = await db.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    return c.json<ApiResponse>(
      { success: false, error: "Comment not found" },
      404
    );
  }

  if (comment.postId !== postId) {
    return c.json<ApiResponse>(
      { success: false, error: "Comment does not belong to this post" },
      400
    );
  }

  // Verify ownership
  if (comment.userId !== userId) {
    return c.json<ApiResponse>(
      { success: false, error: "You can only delete your own comments" },
      403
    );
  }

  // Delete comment and decrement counter in transaction
  await db.$transaction([
    db.comment.delete({
      where: { id: commentId },
    }),
    db.post.update({
      where: { id: postId },
      data: { commentCount: { decrement: 1 } },
    }),
  ]);

  return c.json<ApiResponse<null>>({
    success: true,
    data: null,
  });
});
