import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import type { VacancySearchResult, VacancySearchResponse } from "@rearden/types";

const PAGE_SIZE = 20;

export function useVacancySearch() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [results, setResults] = useState<VacancySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const search = useCallback(async (q: string, type: string | null) => {
    setLoading(true);
    offsetRef.current = 0;
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (q.trim()) params.set("q", q.trim());
      if (type) params.set("type", type);
      const res = await apiFetch<{ success: boolean; data: VacancySearchResponse }>(`/search/vacancies?${params}`);
      setResults(res.data.vacancies);
      setHasMore(res.data.vacancies.length >= PAGE_SIZE);
      offsetRef.current = res.data.vacancies.length;
    } catch {
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
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offsetRef.current) });
      if (query.trim()) params.set("q", query.trim());
      if (typeFilter) params.set("type", typeFilter);
      const res = await apiFetch<{ success: boolean; data: VacancySearchResponse }>(`/search/vacancies?${params}`);
      setResults((prev) => [...prev, ...res.data.vacancies]);
      setHasMore(res.data.vacancies.length >= PAGE_SIZE);
      offsetRef.current += res.data.vacancies.length;
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter, loading, hasMore]);

  useEffect(() => {
    const timer = setTimeout(() => { search(query, typeFilter); }, 300);
    return () => clearTimeout(timer);
  }, [query, typeFilter, search]);

  return { query, setQuery, typeFilter, setTypeFilter, results, loading, hasMore, loadMore };
}
