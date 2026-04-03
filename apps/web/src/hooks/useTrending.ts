import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { TrendingHashtag, TrendingResponse } from "@rearden/types";

export function useTrending() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<{ success: boolean; data: TrendingResponse }>(
          "/search/posts/trending"
        );
        setHashtags(response.data.hashtags);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
        setHashtags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return { hashtags, loading, error };
}
