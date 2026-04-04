import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { usePeopleSearch } from "@/hooks/usePeopleSearch";
import styles from "./SearchPeopleTab.module.scss";

export function SearchPeopleTab() {
  const navigate = useNavigate();
  const { query, setQuery, results, loading, hasMore, loadMore } = usePeopleSearch();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
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
    <div className={styles.peopleTab}>
      <SearchBar
        value={query}
        onChange={setQuery}
        loading={loading && results.length === 0}
        placeholders={["Search by username or name..."]}
      />

      {loading && results.length === 0 ? (
        <div className={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.skeletonTile} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className={styles.grid}>
          {results.map((user) => (
            <div
              key={user.id}
              className={styles.tile}
              onClick={() => navigate(`/user/${user.id}`)}
            >
              <img
                src={user.thumbnailUrl || "/placeholder-avatar.jpg"}
                alt={user.name || user.username || "User"}
                className={styles.tileImg}
                loading="lazy"
              />
              <div className={styles.tileOverlay}>
                <span className={styles.tileName}>
                  {user.username || user.name || "Anonymous"}
                </span>
                {user.title && (
                  <span className={styles.tileTitle}>{user.title}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && query && (
          <div className={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p>No users found</p>
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
