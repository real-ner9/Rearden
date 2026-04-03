import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { usePeopleSearch } from "@/hooks/usePeopleSearch";
import styles from "./SearchPeopleTab.module.scss";

export function SearchPeopleTab() {
  const navigate = useNavigate();
  const { query, setQuery, results, loading, hasMore, loadMore } = usePeopleSearch();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
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

      {/* Suggested heading when no query */}
      {!query && results.length > 0 && (
        <h3 className={styles.sectionTitle}>Suggested</h3>
      )}

      {loading && results.length === 0 ? (
        <div className={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonLine} style={{ width: "70%" }} />
              <div className={styles.skeletonLine} style={{ width: "50%" }} />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <motion.div
          className={styles.grid}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.03 } },
          }}
        >
          {results.map((user) => (
            <motion.div
              key={user.id}
              className={styles.card}
              onClick={() => navigate(`/user/${user.id}`)}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <img
                src={user.thumbnailUrl || "/placeholder-avatar.jpg"}
                alt={user.name || user.username || "User"}
                className={styles.avatar}
              />
              <div className={styles.username}>
                {user.username || user.name || "Anonymous"}
              </div>
              <div className={styles.meta}>
                {user.name && user.username ? user.name : user.title}
              </div>
              {user.title && user.name && user.username && (
                <div className={styles.title}>{user.title}</div>
              )}
            </motion.div>
          ))}
        </motion.div>
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

      {/* Infinite scroll sentinel */}
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
