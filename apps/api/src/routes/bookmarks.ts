import { Hono } from "hono";
import type { ApiResponse, FeedPost } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";

// Routes for /api/posts/:postId/bookmark
export const bookmarkRoutes = new Hono();

// POST /api/posts/:postId/bookmark
bookmarkRoutes.post("/:postId/bookmark", authMiddleware, async (c) => {
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

  // Toggle bookmark
  const existingBookmark = await db.bookmark.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  let bookmarked: boolean;

  if (existingBookmark) {
    // Remove bookmark
    await db.bookmark.delete({
      where: { userId_postId: { userId, postId } },
    });
    bookmarked = false;
  } else {
    // Create bookmark
    await db.bookmark.create({
      data: { userId, postId },
    });
    bookmarked = true;
  }

  return c.json<ApiResponse<{ bookmarked: boolean }>>({
    success: true,
    data: { bookmarked },
  });
});

// Routes for /api/bookmarks
export const bookmarkListRoutes = new Hono();

// GET /api/bookmarks
bookmarkListRoutes.get("/", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const cursorParam = c.req.query("cursor");
  const limitParam = c.req.query("limit");

  const limit = Math.min(
    parseInt(limitParam || "20", 10),
    50
  );

  // Build cursor filter
  const cursorFilter = cursorParam
    ? { createdAt: { lt: new Date(cursorParam) } }
    : {};

  // Fetch bookmarks with posts
  const bookmarks = await db.bookmark.findMany({
    where: { userId, ...cursorFilter },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      post: {
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
      },
    },
  });

  const hasMore = bookmarks.length > limit;
  const items = hasMore ? bookmarks.slice(0, limit) : bookmarks;

  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  // Get post IDs to fetch likes
  const postIds = items.map((b) => b.post.id);

  const userLikes = await db.like.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });

  const likedPostIds = new Set(userLikes.map((l) => l.postId));

  // Map to FeedPost shape (all are bookmarked by definition)
  const feedPosts: FeedPost[] = items.map((bookmark) => ({
    id: bookmark.post.id,
    type: bookmark.post.type as "text" | "image" | "video",
    content: bookmark.post.content,
    hashtags: bookmark.post.hashtags,
    imageUrl: bookmark.post.imageUrl,
    imageUrls: bookmark.post.imageUrls ?? [],
    videoUrl: bookmark.post.videoUrl,
    thumbnailUrl: bookmark.post.thumbnailUrl,
    likeCount: bookmark.post.likeCount,
    commentCount: bookmark.post.commentCount,
    isLiked: likedPostIds.has(bookmark.post.id),
    isBookmarked: true,
    createdAt: bookmark.post.createdAt.toISOString(),
    author: {
      id: bookmark.post.user.id,
      name: bookmark.post.user.name,
      username: bookmark.post.user.username,
      thumbnailUrl: bookmark.post.user.thumbnailUrl,
      title: bookmark.post.user.title,
    },
  }));

  return c.json<ApiResponse<FeedPost[]>>({
    success: true,
    data: feedPosts,
    meta: { nextCursor },
  });
});
