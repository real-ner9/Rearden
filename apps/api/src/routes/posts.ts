import { Hono } from "hono";
import type { ApiResponse, Post, VideoPost } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";

type AuthEnv = { Variables: { userId: string } };

export const postRoutes = new Hono<AuthEnv>();

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

function toVideoPost(row: any): VideoPost {
  return {
    ...toPost(row),
    type: "video",
    videoUrl: row.videoUrl,
    author: {
      id: row.user.id,
      name: row.user.name,
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
      return c.json<ApiResponse<VideoPost[]>>({
        success: true,
        data: sorted.map(toVideoPost),
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
    return c.json<ApiResponse<VideoPost[]>>({
      success: true,
      data: items.map(toVideoPost),
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
    return c.json<ApiResponse<VideoPost>>({
      success: true,
      data: toVideoPost(row),
    });
  }

  return c.json<ApiResponse<Post>>({
    success: true,
    data: toPost(row),
  });
});

// POST /api/posts
postRoutes.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();

    const hashtags =
      (body.content as string)
        .match(/#(\w+)/g)
        ?.map((tag: string) => tag.slice(1).toLowerCase()) ?? [];

    const row = await db.post.create({
      data: {
        userId: body.userId,
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
});
