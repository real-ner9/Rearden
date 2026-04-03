import { Hono } from "hono";
import type { ApiResponse, FeedPost } from "@rearden/types";
import { db } from "../lib/db.js";
import { verifyToken } from "../lib/auth.js";

export const feedRoutes = new Hono();

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

feedRoutes.get("/", async (c) => {
  const cursorParam = c.req.query("cursor");
  const limitParam = c.req.query("limit");
  const userIdParam = c.req.query("userId");

  const limit = Math.min(
    parseInt(limitParam || "20", 10),
    50
  );

  const userId = extractOptionalUserId(c.req.header("Authorization"));

  // Build cursor filter
  const cursorFilter = cursorParam
    ? { createdAt: { lt: new Date(cursorParam) } }
    : {};

  // Fetch posts
  const posts = await db.post.findMany({
    where: {
      ...cursorFilter,
      ...(userIdParam ? { userId: userIdParam } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
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
  });

  // Determine if there are more results
  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;

  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  // Fetch user's likes and bookmarks for these posts if authenticated
  let userLikes: Set<string> = new Set();
  let userBookmarks: Set<string> = new Set();

  if (userId) {
    const postIds = items.map((p) => p.id);

    const [likes, bookmarks] = await Promise.all([
      db.like.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
      db.bookmark.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    userLikes = new Set(likes.map((l) => l.postId));
    userBookmarks = new Set(bookmarks.map((b) => b.postId));
  }

  // Map to FeedPost shape
  const feedPosts: FeedPost[] = items.map((post) => ({
    id: post.id,
    type: post.type as "text" | "image" | "video",
    content: post.content,
    hashtags: post.hashtags,
    imageUrl: post.imageUrl,
    imageUrls: post.imageUrls ?? [],
    videoUrl: post.videoUrl,
    thumbnailUrl: post.thumbnailUrl,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    isLiked: userLikes.has(post.id),
    isBookmarked: userBookmarks.has(post.id),
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.user.id,
      name: post.user.name,
      username: post.user.username,
      thumbnailUrl: post.user.thumbnailUrl,
      title: post.user.title,
    },
  }));

  return c.json<ApiResponse<FeedPost[]>>({
    success: true,
    data: feedPosts,
    meta: { nextCursor },
  });
});
