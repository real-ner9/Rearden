import { Hono } from "hono";
import type { ApiResponse, Post, VideoPost } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimit } from "../lib/rateLimit.js";
import { verifyToken } from "../lib/auth.js";

type AuthEnv = { Variables: { userId: string } };

export const postRoutes = new Hono<AuthEnv>();

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

function toPost(row: any): Post {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type ?? "text",
    content: row.content,
    hashtags: row.hashtags,
    imageUrl: row.imageUrl ?? null,
    imageUrls: row.imageUrls ?? [],
    videoUrl: row.videoUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    crossPostInstagram: row.crossPostInstagram ?? false,
    crossPostShorts: row.crossPostShorts ?? false,
    crossPostTiktok: row.crossPostTiktok ?? false,
    createdAt: row.createdAt.toISOString(),
  };
}

function toVideoPost(row: any, userLikes: Set<string>, userBookmarks: Set<string>): VideoPost {
  return {
    ...toPost(row),
    type: "video",
    videoUrl: row.videoUrl,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    isLiked: userLikes.has(row.id),
    isBookmarked: userBookmarks.has(row.id),
    author: {
      id: row.user.id,
      name: row.user.name,
      username: row.user.username ?? null,
      thumbnailUrl: row.user.thumbnailUrl ?? null,
      title: row.user.title,
      location: row.user.location,
      experience: row.user.experience,
      skills: row.user.skills,
      resumeText: row.user.resumeText ?? null,
    },
  };
}

// GET /api/posts
// Chronological: ?userId=&type=&limit=&cursor=&startFrom=
// Shuffled:      ?type=&limit=&seed=&offset=&startFrom=
postRoutes.get("/", async (c) => {
  const userId = c.req.query("userId");
  const type = c.req.query("type");
  const limit = Math.min(Number(c.req.query("limit")) || 50, 50);
  const seed = c.req.query("seed");
  const includeUser = type === "video";

  // ── Shuffled feed (seed-based deterministic random order) ──
  if (seed) {
    // Validate seed parameter (alphanumeric only)
    if (!/^[a-zA-Z0-9_-]+$/.test(seed)) {
      return c.json<ApiResponse>(
        { success: false, error: "Invalid seed parameter" },
        400,
      );
    }

    const offset = Number(c.req.query("offset")) || 0;
    const startFrom = c.req.query("startFrom");
    const take = limit + 1;

    // Build parameterized query
    const conditions: string[] = [];
    const params: unknown[] = [];
    let pi = 1;

    if (type) {
      conditions.push(`type = $${pi++}`);
      params.push(type);
    }
    if (userId) {
      conditions.push(`"userId" = $${pi++}`);
      params.push(userId);
    }
    if (startFrom) {
      conditions.push(`id != $${pi++}`);
      params.push(startFrom);
    }

    const seedP = pi++;
    params.push(seed);
    const limitP = pi++;
    params.push(take);
    const offsetP = pi++;
    params.push(offset);

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT id FROM "Post" ${where} ORDER BY md5($${seedP} || id) LIMIT $${limitP} OFFSET $${offsetP}`;

    const idRows = await db.$queryRawUnsafe<{ id: string }[]>(sql, ...params);

    const hasMore = idRows.length > limit;
    const ids = (hasMore ? idRows.slice(0, limit) : idRows).map((r) => r.id);

    // Prepend startFrom post on first page
    if (startFrom && offset === 0) {
      ids.unshift(startFrom);
    }

    if (ids.length === 0) {
      return c.json<ApiResponse>({
        success: true,
        data: [],
        meta: { nextOffset: offset, hasMore: false },
      });
    }

    // Fetch full records, preserve shuffled order
    const rows = await db.post.findMany({
      where: { id: { in: ids } },
      include: includeUser ? { user: true } : undefined,
    });
    const map = new Map(rows.map((r) => [r.id, r]));
    const sorted = ids.map((id) => map.get(id)).filter(Boolean);

    const nextOffset = offset + (hasMore ? limit : idRows.length);

    if (includeUser) {
      // Fetch user's likes and bookmarks if authenticated
      const authUserId = extractOptionalUserId(c.req.header("Authorization"));
      let userLikes: Set<string> = new Set();
      let userBookmarks: Set<string> = new Set();

      if (authUserId) {
        const postIds = sorted.map((r: any) => r.id);
        const [likes, bookmarks] = await Promise.all([
          db.like.findMany({
            where: { userId: authUserId, postId: { in: postIds } },
            select: { postId: true },
          }),
          db.bookmark.findMany({
            where: { userId: authUserId, postId: { in: postIds } },
            select: { postId: true },
          }),
        ]);
        userLikes = new Set(likes.map((l: any) => l.postId));
        userBookmarks = new Set(bookmarks.map((b: any) => b.postId));
      }

      return c.json<ApiResponse<VideoPost[]>>({
        success: true,
        data: sorted.map((r) => toVideoPost(r, userLikes, userBookmarks)),
        meta: { nextOffset, hasMore },
      });
    }
    return c.json<ApiResponse<Post[]>>({
      success: true,
      data: sorted.map(toPost),
      meta: { nextOffset, hasMore },
    });
  }

  // ── Chronological feed (cursor-based) ──
  const cursor = c.req.query("cursor");
  const startFrom = c.req.query("startFrom");

  const where: any = {};
  if (userId) where.userId = userId;
  if (type) where.type = type;

  if (startFrom) {
    const anchor = await db.post.findUnique({ where: { id: startFrom } });
    if (anchor) {
      where.createdAt = { lte: anchor.createdAt };
    }
  } else if (cursor) {
    const cursorPost = await db.post.findUnique({ where: { id: cursor } });
    if (cursorPost) {
      where.createdAt = { lt: cursorPost.createdAt };
    }
  }

  const rows = await db.post.findMany({
    where,
    include: includeUser ? { user: true } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  if (includeUser) {
    // Fetch user's likes and bookmarks if authenticated
    const authUserId = extractOptionalUserId(c.req.header("Authorization"));
    let userLikes: Set<string> = new Set();
    let userBookmarks: Set<string> = new Set();

    if (authUserId) {
      const postIds = items.map((r: any) => r.id);
      const [likes, bookmarks] = await Promise.all([
        db.like.findMany({
          where: { userId: authUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        db.bookmark.findMany({
          where: { userId: authUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);
      userLikes = new Set(likes.map((l: any) => l.postId));
      userBookmarks = new Set(bookmarks.map((b: any) => b.postId));
    }

    return c.json<ApiResponse<VideoPost[]>>({
      success: true,
      data: items.map((r) => toVideoPost(r, userLikes, userBookmarks)),
      meta: { nextCursor },
    });
  }

  return c.json<ApiResponse<Post[]>>({
    success: true,
    data: items.map(toPost),
    meta: { nextCursor },
  });
});

// GET /api/posts/:id
postRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");

  const row = await db.post.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!row) {
    return c.json<ApiResponse>({ success: false, error: "Post not found" }, 404);
  }

  if (row.type === "video") {
    // Fetch user's like and bookmark status if authenticated
    const authUserId = extractOptionalUserId(c.req.header("Authorization"));
    let userLikes: Set<string> = new Set();
    let userBookmarks: Set<string> = new Set();

    if (authUserId) {
      const [likes, bookmarks] = await Promise.all([
        db.like.findMany({
          where: { userId: authUserId, postId: id },
          select: { postId: true },
        }),
        db.bookmark.findMany({
          where: { userId: authUserId, postId: id },
          select: { postId: true },
        }),
      ]);
      userLikes = new Set(likes.map((l: any) => l.postId));
      userBookmarks = new Set(bookmarks.map((b: any) => b.postId));
    }

    return c.json<ApiResponse<VideoPost>>({
      success: true,
      data: toVideoPost(row, userLikes, userBookmarks),
    });
  }

  return c.json<ApiResponse<Post>>({
    success: true,
    data: toPost(row),
  });
});

// POST /api/posts
postRoutes.post(
  "/",
  authMiddleware,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  async (c) => {
    try {
      const userId = c.get("userId");
      const body = await c.req.json();

      // Validate content
      if (!body.content || typeof body.content !== "string") {
        return c.json<ApiResponse>(
          { success: false, error: "content is required and must be a string" },
          400,
        );
      }

      if (body.content.length > 5000) {
        return c.json<ApiResponse>(
          { success: false, error: "content must not exceed 5000 characters" },
          400,
        );
      }

      // Validate type
      const validTypes = ["text", "image", "video"];
      if (body.type && !validTypes.includes(body.type)) {
        return c.json<ApiResponse>(
          { success: false, error: "type must be one of: text, image, video" },
          400,
        );
      }

      const hashtags =
        (body.content as string)
          .match(/#(\w+)/g)
          ?.map((tag: string) => tag.slice(1).toLowerCase()) ?? [];

      const row = await db.post.create({
        data: {
          userId,
          type: body.type ?? "text",
          content: body.content,
          hashtags,
          imageUrl: body.imageUrls?.[0] ?? body.imageUrl ?? null,
          imageUrls: body.imageUrls ?? (body.imageUrl ? [body.imageUrl] : []),
          videoUrl: body.videoUrl ?? null,
          thumbnailUrl: body.thumbnailUrl ?? null,
          crossPostInstagram: body.crossPostInstagram ?? false,
          crossPostShorts: body.crossPostShorts ?? false,
          crossPostTiktok: body.crossPostTiktok ?? false,
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
  }
);
