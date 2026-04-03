import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { PostSearchResult, PostSearchResponse } from "@rearden/types";

export function usePostSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PostSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"text" | "image" | "video" | null>(null);

  const search = useCallback(
    async (searchQuery: string, type: "text" | "image" | "video" | null) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<{ success: boolean; data: PostSearchResponse }>(
          "/search/posts",
          {
            method: "POST",
            body: JSON.stringify({
              query: searchQuery,
              type: type || undefined,
            }),
          }
        );
        setResults(response.data.posts);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query, typeFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, typeFilter, search]);

  return { query, setQuery, results, loading, error, typeFilter, setTypeFilter };
}
