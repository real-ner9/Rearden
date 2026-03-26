import type { User, SearchFilters } from "@rearden/types";

export interface ScoredUser {
  user: User;
  score: number;
  matchReason: string;
}

export function searchUsers(
  users: User[],
  query: string,
  filters?: SearchFilters
): ScoredUser[] {
  // Handle empty query - return all users with random scores
  if (!query.trim()) {
    return users
      .filter((user) => applyFilters(user, filters))
      .map((user) => ({
        user,
        score: Math.floor(Math.random() * 16) + 85, // 85-100
        matchReason: "Featured Talent",
      }))
      .sort((a, b) => b.score - a.score);
  }

  // Parse query into lowercase tokens
  const tokens = query.toLowerCase().trim().split(/\s+/);

  // Score each user
  const scoredUsers = users
    .map((user): ScoredUser => {
      let totalScore = 0;
      const matchReasons: string[] = [];
      const matchedSkills: string[] = [];

      // Skill matching
      for (const skill of user.skills) {
        const skillLower = skill.toLowerCase();

        // Exact match
        if (tokens.some((token) => token === skillLower)) {
          totalScore += 25;
          matchedSkills.push(skill);
        }
        // Partial match
        else if (tokens.some((token) => skillLower.includes(token))) {
          totalScore += 15;
          matchedSkills.push(skill);
        }
      }

      if (matchedSkills.length > 0) {
        matchReasons.push(`Skills: ${matchedSkills.join(", ")}`);
      }

      // Title matching
      const titleLower = user.title.toLowerCase();
      const titleMatches = tokens.filter((token) => titleLower.includes(token));
      if (titleMatches.length > 0) {
        totalScore += titleMatches.length * 20;
        matchReasons.push(`Title: ${user.title}`);
      }

      // Location matching
      const locationLower = user.location.toLowerCase();
      const locationMatches = tokens.filter((token) => locationLower.includes(token));
      if (locationMatches.length > 0) {
        totalScore += locationMatches.length * 15;
        matchReasons.push(`Location: ${user.location}`);
      }

      // Bio matching
      const bioLower = user.bio.toLowerCase();
      const bioMatches = tokens.filter((token) => bioLower.includes(token));
      if (bioMatches.length > 0) {
        totalScore += bioMatches.length * 5;
      }

      // Experience keywords
      const queryLower = query.toLowerCase();
      if (queryLower.includes("senior") && user.experience >= 5) {
        totalScore += 10;
      }
      if (queryLower.includes("junior") && user.experience <= 3) {
        totalScore += 10;
      }
      if (queryLower.includes("lead") && user.experience >= 8) {
        totalScore += 10;
      }

      // Calculate max possible score for normalization
      const maxSkillScore = tokens.length * 25;
      const maxTitleScore = tokens.length * 20;
      const maxLocationScore = tokens.length * 15;
      const maxBioScore = tokens.length * 5;
      const maxExperienceBonus = 10;
      const maxPossibleScore =
        maxSkillScore + maxTitleScore + maxLocationScore + maxBioScore + maxExperienceBonus;

      // Normalize to 0-100
      const normalizedScore = maxPossibleScore > 0
        ? Math.min(100, Math.round((totalScore / maxPossibleScore) * 100))
        : 0;

      const matchReason = matchReasons.length > 0
        ? matchReasons.join(" | ")
        : "General match";

      return {
        user,
        score: normalizedScore,
        matchReason,
      };
    })
    .filter((scored) => scored.score > 0) // Filter out zero scores
    .filter((scored) => applyFilters(scored.user, filters)) // Apply additional filters
    .sort((a, b) => b.score - a.score); // Sort by score descending

  return scoredUsers;
}

function applyFilters(user: User, filters?: SearchFilters): boolean {
  if (!filters) return true;

  // Skills filter
  if (filters.skills && filters.skills.length > 0) {
    const userSkillsLower = user.skills.map((s) => s.toLowerCase());
    const hasAllSkills = filters.skills.every((skill) =>
      userSkillsLower.some((us) => us.includes(skill.toLowerCase()))
    );
    if (!hasAllSkills) return false;
  }

  // Location filter
  if (filters.location) {
    const locationMatch = user.location
      .toLowerCase()
      .includes(filters.location.toLowerCase());
    if (!locationMatch) return false;
  }

  // Experience range filter
  if (filters.experienceMin !== undefined && user.experience < filters.experienceMin) {
    return false;
  }
  if (filters.experienceMax !== undefined && user.experience > filters.experienceMax) {
    return false;
  }

  // Availability filter
  if (filters.availability && filters.availability.length > 0) {
    if (!filters.availability.includes(user.availability)) {
      return false;
    }
  }

  return true;
}
