import { Hono } from "hono";
import type { ApiResponse, Candidate, SearchQuery, SearchResult } from "@rearden/types";
import { db } from "../lib/db.js";
import { searchCandidates } from "../lib/searchEngine.js";

export const searchRoutes = new Hono();

function toCandidate(row: any): Candidate {
  return {
    ...row,
    role: "candidate" as const,
    resume: row.resume ?? null,
    resumeUrl: row.resumeUrl ?? null,
    resumeText: row.resumeText ?? null,
    videoUrl: row.videoUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// POST /api/search - Search candidates
searchRoutes.post("/", async (c) => {
  try {
    const body = (await c.req.json()) as SearchQuery;
    const { query, filters } = body;

    const startTime = Date.now();

    // Fetch all candidates from DB
    const rows = await db.candidate.findMany();
    const candidates = rows.map(toCandidate);

    // Perform search using existing engine
    const scoredCandidates = searchCandidates(candidates, query, filters);

    const searchTimeMs = Date.now() - startTime;

    const results: (SearchResult & { candidate: Candidate })[] =
      scoredCandidates.map((sc) => ({
        candidateId: sc.candidate.id,
        score: sc.score,
        matchReason: sc.matchReason,
        candidate: sc.candidate,
      }));

    return c.json<ApiResponse>({
      success: true,
      data: {
        results,
        query,
        totalCandidates: candidates.length,
        searchTimeMs,
      },
    });
  } catch {
    return c.json<ApiResponse>(
      { success: false, error: "Invalid search request" },
      400,
    );
  }
});
