import { Hono } from "hono";
import type { ApiResponse, FollowUser } from "@rearden/types";
import { db } from "../lib/db.js";
import { authMiddleware } from "../middleware/auth.js";
import { verifyToken } from "../lib/auth.js";

export const followRoutes = new Hono();

// POST /api/users/:id/follow — toggle follow
followRoutes.post("/:id/follow", authMiddleware, async (c) => {
  const targetId = c.req.param("id");
  const userId = c.get("userId");

  if (userId === targetId) {
    return c.json<ApiResponse>(
      { success: false, error: "Cannot follow yourself" },
      400,
    );
  }

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return c.json<ApiResponse>(
      { success: false, error: "User not found" },
      404,
    );
  }

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: userId, followingId: targetId } },
  });

  let following: boolean;

  if (existing) {
    await db.$transaction([
      db.follow.delete({
        where: { followerId_followingId: { followerId: userId, followingId: targetId } },
      }),
      db.user.update({
        where: { id: userId },
        data: { followingCount: { decrement: 1 } },
      }),
      db.user.update({
        where: { id: targetId },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);
    following = false;
  } else {
    await db.$transaction([
      db.follow.create({
        data: { followerId: userId, followingId: targetId },
      }),
      db.user.update({
        where: { id: userId },
        data: { followingCount: { increment: 1 } },
      }),
      db.user.update({
        where: { id: targetId },
        data: { followerCount: { increment: 1 } },
      }),
    ]);
    following = true;
  }

  const updated = await db.user.findUnique({ where: { id: targetId } });

  return c.json<ApiResponse<{ following: boolean; followerCount: number; followingCount: number }>>({
    success: true,
    data: {
      following,
      followerCount: updated!.followerCount,
      followingCount: updated!.followingCount,
    },
  });
});

// Helper: extract userId from Bearer token if present (no 401 if missing)
function optionalUserId(c: any): string | null {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = verifyToken(header.slice(7));
    return payload.userId;
  } catch {
    return null;
  }
}

// GET /api/users/:id/followers — paginated list
followRoutes.get("/:id/followers", async (c) => {
  const targetId = c.req.param("id");
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit")) || 20, 50);
  const currentUserId = optionalUserId(c);

  const follows = await db.follow.findMany({
    where: { followingId: targetId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      follower: {
        select: { id: true, name: true, username: true, thumbnailUrl: true, title: true },
      },
    },
  });

  const hasMore = follows.length > limit;
  const items = hasMore ? follows.slice(0, limit) : follows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  let followingSet = new Set<string>();
  if (currentUserId && items.length > 0) {
    const myFollows = await db.follow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: items.map((f) => f.follower.id) },
      },
      select: { followingId: true },
    });
    followingSet = new Set(myFollows.map((f) => f.followingId));
  }

  const data: FollowUser[] = items.map((f) => ({
    id: f.follower.id,
    name: f.follower.name,
    username: f.follower.username,
    thumbnailUrl: f.follower.thumbnailUrl,
    title: f.follower.title,
    isFollowing: followingSet.has(f.follower.id),
  }));

  return c.json<ApiResponse<{ users: FollowUser[]; nextCursor: string | null }>>({
    success: true,
    data: { users: data, nextCursor },
  });
});

// GET /api/users/:id/following — paginated list
followRoutes.get("/:id/following", async (c) => {
  const targetId = c.req.param("id");
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit")) || 20, 50);
  const currentUserId = optionalUserId(c);

  const follows = await db.follow.findMany({
    where: { followerId: targetId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      following: {
        select: { id: true, name: true, username: true, thumbnailUrl: true, title: true },
      },
    },
  });

  const hasMore = follows.length > limit;
  const items = hasMore ? follows.slice(0, limit) : follows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  let followingSet = new Set<string>();
  if (currentUserId && items.length > 0) {
    const myFollows = await db.follow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: items.map((f) => f.following.id) },
      },
      select: { followingId: true },
    });
    followingSet = new Set(myFollows.map((f) => f.followingId));
  }

  const data: FollowUser[] = items.map((f) => ({
    id: f.following.id,
    name: f.following.name,
    username: f.following.username,
    thumbnailUrl: f.following.thumbnailUrl,
    title: f.following.title,
    isFollowing: followingSet.has(f.following.id),
  }));

  return c.json<ApiResponse<{ users: FollowUser[]; nextCursor: string | null }>>({
    success: true,
    data: { users: data, nextCursor },
  });
});
