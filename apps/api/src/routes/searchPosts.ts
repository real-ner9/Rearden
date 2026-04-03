import { Hono } from "hono";
import type {
  ApiResponse,
  PostSearchQuery,
  PostSearchResponse,
  PostSearchResult,
  TrendingResponse,
  TrendingHashtag,
} from "@rearden/types";
import { db } from "../lib/db.js";

export const searchPostsRoutes = new Hono();

// POST / - Content search
searchPostsRoutes.post("/", async (c) => {
  try {
    const body = (await c.req.json()) as PostSearchQuery;
    const { query, type, cursor, limit = 20 } = body;

    // Build where clause
    let where: any = {};

    if (query) {
      const trimmedQuery = query.trim();

      if (trimmedQuery.startsWith("#")) {
        // Hashtag search
        const hashtag = trimmedQuery.slice(1);
        where.hashtags = { has: hashtag };
      } else {
        // Content, author, or hashtag contains query
        where.OR = [
          {
            content: {
              contains: trimmedQuery,
              mode: "insensitive" as const,
            },
          },
          {
            user: {
              name: {
                contains: trimmedQuery,
                mode: "insensitive" as const,
              },
            },
          },
          {
            user: {
              username: {
                contains: trimmedQuery,
                mode: "insensitive" as const,
              },
            },
          },
          {
            hashtags: { has: trimmedQuery },
          },
        ];
      }
    }

    // Add type filter if provided
    if (type) {
      where.type = type;
    }

    // Count total matches (without pagination)
    const total = await db.post.count({ where });

    // Fetch posts with user relation
    const posts = await db.post.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" as const },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            title: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    // Map to PostSearchResult
    const results: PostSearchResult[] = posts.map((post) => ({
      id: post.id,
      type: post.type as "text" | "image" | "video",
      content: post.content,
      hashtags: post.hashtags,
      imageUrl: post.imageUrl,
      imageUrls: post.imageUrls ?? [],
      videoUrl: post.videoUrl,
      thumbnailUrl: post.thumbnailUrl,
      createdAt: post.createdAt.toISOString(),
      user: post.user,
    }));

    // Determine next cursor
    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

    return c.json<ApiResponse<PostSearchResponse>>({
      success: true,
      data: {
        posts: results,
        nextCursor,
        total,
      },
    });
  } catch (error) {
    console.error("Post search error:", error);
    return c.json<ApiResponse>(
      { success: false, error: "Failed to search posts" },
      400
    );
  }
});

// GET /trending - Trending hashtags
searchPostsRoutes.get("/trending", async (c) => {
  try {
    // Aggregate hashtags using raw SQL
    const result = await db.$queryRaw<{ tag: string; count: number }[]>`
      SELECT tag, COUNT(*)::int as count
      FROM "Post", unnest(hashtags) AS tag
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 12
    `;

    const hashtags: TrendingHashtag[] = result.map((row) => ({
      tag: row.tag,
      count: row.count,
    }));

    return c.json<ApiResponse<TrendingResponse>>({
      success: true,
      data: {
        hashtags,
      },
    });
  } catch (error) {
    console.error("Trending hashtags error:", error);
    return c.json<ApiResponse>(
      { success: false, error: "Failed to fetch trending hashtags" },
      500
    );
  }
});
