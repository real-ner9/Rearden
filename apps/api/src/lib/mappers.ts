import type { User } from "@rearden/types";

/**
 * Converts a database user record to the public User type.
 * SECURITY: Never exposes passwordHash. Phone and email are considered private.
 */
export function toUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    username: row.username ?? null,
    onboarded: row.onboarded,
    email: row.email ?? null,
    name: row.name ?? null,
    skills: row.skills ?? [],
    topSkills: row.topSkills ?? [],
    experience: row.experience ?? 0,
    videoUrl: row.videoUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    resumeUrl: row.resumeUrl ?? null,
    resumeText: row.resumeText ?? null,
    resume: row.resume ?? null,
    location: row.location ?? "",
    title: row.title ?? "",
    bio: row.bio ?? "",
    availability: row.availability ?? "immediate",
    followerCount: row.followerCount ?? 0,
    followingCount: row.followingCount ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
