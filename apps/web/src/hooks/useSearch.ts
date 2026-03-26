import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { User } from "@rearden/types";

export interface SearchResultWithUser {
  userId: string;
  score: number;
  matchReason: string;
  user: User;
}

interface SearchApiResponse {
  results: SearchResultWithUser[];
  query: string;
  totalUsers: number;
  searchTimeMs: number;
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!searchQuery.trim()) {
        const response = await apiFetch<{ success: boolean; data: User[] }>("/users");
        setResults(
          response.data.map((user, i) => ({
            userId: user.id,
            score: 90 - i * 2,
            matchReason: "Featured Talent",
            user,
          }))
        );
      } else {
        const response = await apiFetch<{ success: boolean; data: SearchApiResponse }>(
          "/search",
          {
            method: "POST",
            body: JSON.stringify({ query: searchQuery }),
          }
        );
        setResults(response.data.results);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  return { query, setQuery, results, loading, error };
}
