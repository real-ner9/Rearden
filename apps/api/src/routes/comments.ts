import { Hono } from "hono";
import type { ApiResponse, PostComment, CreateCommentPayload } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";
import { verifyToken } from "../lib/auth.js";

export const commentRoutes = new Hono();

// Helper to extract userId from Bearer token without requiring auth
function extractOptionalUserId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    return payload.userId;
  } catch {
    return null;
  }
}

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

  // Extract optional userId for like status
  const authUserId = extractOptionalUserId(c.req.header("Authorization"));

  // Fetch top-level comments only
  const comments = await db.comment.findMany({
    where: { postId, parentId: null, ...cursorFilter },
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
      replies: {
        orderBy: { createdAt: "asc" },
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
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  const hasMore = comments.length > limit;
  const items = hasMore ? comments.slice(0, limit) : comments;

  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  // Fetch user's comment likes if authenticated
  let userLikes: Set<string> = new Set();
  if (authUserId) {
    const allCommentIds = items.flatMap((comment) => [
      comment.id,
      ...comment.replies.map((r) => r.id),
    ]);
    const likes = await db.commentLike.findMany({
      where: { userId: authUserId, commentId: { in: allCommentIds } },
      select: { commentId: true },
    });
    userLikes = new Set(likes.map((l) => l.commentId));
  }

  const result: PostComment[] = items.map((comment) => ({
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    text: comment.text,
    parentId: null,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.user.id,
      name: comment.user.name,
      username: comment.user.username,
      thumbnailUrl: comment.user.thumbnailUrl,
    },
    replies: comment.replies.map((reply) => ({
      id: reply.id,
      postId: reply.postId,
      userId: reply.userId,
      text: reply.text,
      parentId: reply.parentId,
      createdAt: reply.createdAt.toISOString(),
      author: {
        id: reply.user.id,
        name: reply.user.name,
        username: reply.user.username,
        thumbnailUrl: reply.user.thumbnailUrl,
      },
      likeCount: reply.likeCount,
      isLiked: userLikes.has(reply.id),
    })),
    replyCount: comment._count.replies,
    likeCount: comment.likeCount,
    isLiked: userLikes.has(comment.id),
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

  // Validate parent comment if replying
  const parentId = body.parentId || null;
  if (parentId) {
    const parentComment = await db.comment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment) {
      return c.json<ApiResponse>(
        { success: false, error: "Parent comment not found" },
        404
      );
    }

    if (parentComment.postId !== postId) {
      return c.json<ApiResponse>(
        { success: false, error: "Parent comment does not belong to this post" },
        400
      );
    }

    if (parentComment.parentId !== null) {
      return c.json<ApiResponse>(
        { success: false, error: "Cannot reply to a reply (only 1-level nesting allowed)" },
        400
      );
    }
  }

  // Create comment and increment counter in transaction
  const [comment] = await db.$transaction([
    db.comment.create({
      data: { postId, userId, text, parentId },
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
    parentId: comment.parentId,
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

  // Count replies (cascade delete will remove them, but we need to decrement count correctly)
  const replyCount = await db.comment.count({
    where: { parentId: commentId },
  });

  // Delete comment and decrement counter in transaction
  await db.$transaction([
    db.comment.delete({
      where: { id: commentId },
    }),
    db.post.update({
      where: { id: postId },
      data: { commentCount: { decrement: 1 + replyCount } },
    }),
  ]);

  return c.json<ApiResponse<null>>({
    success: true,
    data: null,
  });
});

// POST /api/posts/:postId/comments/:commentId/like
commentRoutes.post("/:postId/comments/:commentId/like", authMiddleware, async (c) => {
  const postId = c.req.param("postId");
  const commentId = c.req.param("commentId");
  const userId = c.get("userId");

  // Check if comment exists and belongs to this post
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

  // Toggle like
  const existingLike = await db.commentLike.findUnique({
    where: {
      userId_commentId: { userId, commentId },
    },
  });

  let liked: boolean;
  let updatedComment;

  if (existingLike) {
    // Unlike: delete like and decrement counter
    const result = await db.$transaction([
      db.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      }),
      db.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    liked = false;
    updatedComment = result[1];
  } else {
    // Like: create like and increment counter
    const result = await db.$transaction([
      db.commentLike.create({
        data: { userId, commentId },
      }),
      db.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    liked = true;
    updatedComment = result[1];
  }

  return c.json<ApiResponse<{ liked: boolean; likeCount: number }>>({
    success: true,
    data: { liked, likeCount: updatedComment.likeCount },
  });
});
