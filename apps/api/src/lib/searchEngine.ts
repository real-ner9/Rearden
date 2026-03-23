import type { Candidate, SearchFilters } from "@rearden/types";

export interface ScoredCandidate {
  candidate: Candidate;
  score: number;
  matchReason: string;
}

export function searchCandidates(
  candidates: Candidate[],
  query: string,
  filters?: SearchFilters
): ScoredCandidate[] {
  // Handle empty query - return all candidates with random scores
  if (!query.trim()) {
    return candidates
      .filter((candidate) => applyFilters(candidate, filters))
      .map((candidate) => ({
        candidate,
        score: Math.floor(Math.random() * 16) + 85, // 85-100
        matchReason: "Featured Talent",
      }))
      .sort((a, b) => b.score - a.score);
  }

  // Parse query into lowercase tokens
  const tokens = query.toLowerCase().trim().split(/\s+/);

  // Score each candidate
  const scoredCandidates = candidates
    .map((candidate): ScoredCandidate => {
      let totalScore = 0;
      const matchReasons: string[] = [];
      const matchedSkills: string[] = [];

      // Skill matching
      for (const skill of candidate.skills) {
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
      const titleLower = candidate.title.toLowerCase();
      const titleMatches = tokens.filter((token) => titleLower.includes(token));
      if (titleMatches.length > 0) {
        totalScore += titleMatches.length * 20;
        matchReasons.push(`Title: ${candidate.title}`);
      }

      // Location matching
      const locationLower = candidate.location.toLowerCase();
      const locationMatches = tokens.filter((token) => locationLower.includes(token));
      if (locationMatches.length > 0) {
        totalScore += locationMatches.length * 15;
        matchReasons.push(`Location: ${candidate.location}`);
      }

      // Bio matching
      const bioLower = candidate.bio.toLowerCase();
      const bioMatches = tokens.filter((token) => bioLower.includes(token));
      if (bioMatches.length > 0) {
        totalScore += bioMatches.length * 5;
      }

      // Experience keywords
      const queryLower = query.toLowerCase();
      if (queryLower.includes("senior") && candidate.experience >= 5) {
        totalScore += 10;
      }
      if (queryLower.includes("junior") && candidate.experience <= 3) {
        totalScore += 10;
      }
      if (queryLower.includes("lead") && candidate.experience >= 8) {
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
        candidate,
        score: normalizedScore,
        matchReason,
      };
    })
    .filter((scored) => scored.score > 0) // Filter out zero scores
    .filter((scored) => applyFilters(scored.candidate, filters)) // Apply additional filters
    .sort((a, b) => b.score - a.score); // Sort by score descending

  return scoredCandidates;
}

function applyFilters(candidate: Candidate, filters?: SearchFilters): boolean {
  if (!filters) return true;

  // Skills filter
  if (filters.skills && filters.skills.length > 0) {
    const candidateSkillsLower = candidate.skills.map((s) => s.toLowerCase());
    const hasAllSkills = filters.skills.every((skill) =>
      candidateSkillsLower.some((cs) => cs.includes(skill.toLowerCase()))
    );
    if (!hasAllSkills) return false;
  }

  // Location filter
  if (filters.location) {
    const locationMatch = candidate.location
      .toLowerCase()
      .includes(filters.location.toLowerCase());
    if (!locationMatch) return false;
  }

  // Experience range filter
  if (filters.experienceMin !== undefined && candidate.experience < filters.experienceMin) {
    return false;
  }
  if (filters.experienceMax !== undefined && candidate.experience > filters.experienceMax) {
    return false;
  }

  // Availability filter
  if (filters.availability && filters.availability.length > 0) {
    if (!filters.availability.includes(candidate.availability)) {
      return false;
    }
  }

  return true;
}
