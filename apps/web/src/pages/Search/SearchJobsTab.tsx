import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { VacancyCard } from "@/components/VacancyCard/VacancyCard";
import { useVacancySearch } from "@/hooks/useVacancySearch";
import styles from "./SearchJobsTab.module.scss";

const TYPE_FILTERS = [
  { id: null, label: "All" },
  { id: "fulltime", label: "Full-time" },
  { id: "parttime", label: "Part-time" },
  { id: "contract", label: "Contract" },
  { id: "freelance", label: "Freelance" },
];

export function SearchJobsTab() {
  const navigate = useNavigate();
  const { query, setQuery, typeFilter, setTypeFilter, results, loading, hasMore, loadMore } = useVacancySearch();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loading) loadMore();
    },
    [hasMore, loading, loadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(observerCallback, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback]);

  return (
    <div className={styles.jobsTab}>
      <SearchBar value={query} onChange={setQuery} loading={loading && results.length === 0} placeholders={["Search vacancies..."]} />

      <div className={styles.filters}>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.id ?? "all"}
            className={`${styles.chip} ${typeFilter === f.id ? styles.chipActive : ""}`}
            onClick={() => setTypeFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && results.length === 0 ? (
        <div className={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className={styles.list}>
          {results.map((v) => (
            <VacancyCard
              key={v.id}
              vacancy={v}
              author={v.author}
              onClick={() => navigate(`/vacancy/${v.id}`)}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <div className={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p>No vacancies found</p>
          </div>
        )
      )}

      <div ref={sentinelRef} className={styles.sentinel} />

      {loading && results.length > 0 && (
        <div className={styles.loadingMore}>
          <svg className={styles.spinner} width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z" opacity="0.75" />
          </svg>
        </div>
      )}
    </div>
  );
}
