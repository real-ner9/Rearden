import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import type { PeopleSearchResult, PeopleSearchResponse } from "@rearden/types";

const PAGE_SIZE = 30;

export function usePeopleSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PeopleSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const search = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    offsetRef.current = 0;

    try {
      const q = searchQuery.trim();
      const url = q
        ? `/search/people?q=${encodeURIComponent(q)}&limit=${PAGE_SIZE}`
        : `/search/people?limit=${PAGE_SIZE}`;
      const response = await apiFetch<{ success: boolean; data: PeopleSearchResponse }>(url);
      setResults(response.data.users);
      setHasMore(response.data.users.length >= PAGE_SIZE);
      offsetRef.current = response.data.users.length;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const q = query.trim();
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offsetRef.current) });
      if (q) params.set("q", q);
      const response = await apiFetch<{ success: boolean; data: PeopleSearchResponse }>(
        `/search/people?${params}`
      );
      setResults((prev) => [...prev, ...response.data.users]);
      setHasMore(response.data.users.length >= PAGE_SIZE);
      offsetRef.current += response.data.users.length;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [query, loading, hasMore]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return { query, setQuery, results, loading, error, hasMore, loadMore };
}
