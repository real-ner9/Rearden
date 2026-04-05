import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { UserCard } from "@/components/UserCard/UserCard";
import { usePeopleSearch } from "@/hooks/usePeopleSearch";
import { useSearch } from "@/hooks/useSearch";
import styles from "./SearchPeopleTab.module.scss";

const SUGGESTIONS = [
  "Fullstack dev, React + Node, 5+ years",
  "UX designer with Figma experience",
  "DevOps engineer, AWS & Kubernetes",
  "Mobile developer, React Native or Flutter",
  "ML engineer with PyTorch, CV background",
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
};

function KeywordContent() {
  const navigate = useNavigate();
  const { query, setQuery, results, loading, hasMore, loadMore } = usePeopleSearch();
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
    <>
      <SearchBar value={query} onChange={setQuery} loading={loading && results.length === 0} placeholders={["Search by username or name..."]} />

      {loading && results.length === 0 ? (
        <div className={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className={styles.skeletonTile} />)}
        </div>
      ) : results.length > 0 ? (
        <div className={styles.grid}>
          {results.map((user) => (
            <div key={user.id} className={styles.tile} onClick={() => navigate(`/user/${user.id}`)}>
              <img src={user.thumbnailUrl || "/placeholder-avatar.jpg"} alt={user.name || user.username || "User"} className={styles.tileImg} loading="lazy" />
              <div className={styles.tileOverlay}>
                <span className={styles.tileName}>{user.username || user.name || "Anonymous"}</span>
                {user.title && <span className={styles.tileTitle}>{user.title}</span>}
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
    </>
  );
}

function AIMatchContent() {
  const navigate = useNavigate();
  const { query, setQuery, results, loading } = useSearch();
  const [textareaValue, setTextareaValue] = useState("");

  const handleSubmit = () => { if (textareaValue.trim()) setQuery(textareaValue); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };
  const handleSuggestion = (text: string) => { setTextareaValue(text); setQuery(text); };

  const showResults = !!query;

  return (
    <div className={styles.aiContent}>
      {!showResults && (
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" fill="currentColor" />
            </svg>
          </div>
          <h2 className={styles.heroTitle}>AI Match</h2>
          <p className={styles.heroSubtitle}>Describe who you're looking for and let AI find the best candidates</p>
        </div>
      )}

      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea className={styles.textarea} value={textareaValue} onChange={(e) => setTextareaValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe your ideal candidate..." rows={3} />
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={!textareaValue.trim() || loading} aria-label="Search">
            {loading ? <div className={styles.btnSpinner} /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>

        {!showResults && (
          <div className={styles.suggestions}>
            <span className={styles.suggestionsLabel}>Try:</span>
            {SUGGESTIONS.map((s) => (
              <button key={s} className={styles.suggestionChip} onClick={() => handleSuggestion(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {showResults && (
        <>
          {loading && results.length === 0 ? (
            <div className={styles.aiGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.aiSkeleton}>
                  <div className={styles.aiSkeletonThumb} />
                  <div className={styles.aiSkeletonContent}>
                    <div className={styles.aiSkeletonLine} style={{ width: "60%" }} />
                    <div className={styles.aiSkeletonLine} style={{ width: "40%" }} />
                    <div className={styles.aiSkeletonLine} style={{ width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className={styles.statsBar}>{results.length} match{results.length !== 1 ? "es" : ""} found</div>
              <motion.div className={styles.aiGrid} variants={containerVariants} initial="hidden" animate="visible" key={query}>
                {results.map((result) => (
                  <motion.div key={result.userId} variants={cardVariants}>
                    <UserCard user={result.user} score={result.score} matchReason={result.matchReason} onClick={() => navigate(`/user/${result.userId}`)} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : (
            !loading && (
              <div className={styles.aiEmpty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <h3>No matches found</h3>
                <p>Try adjusting your description or be more specific</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

export function SearchPeopleTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAiMode = searchParams.get("mode") === "ai";

  const toggleMode = (ai: boolean) => {
    const p = new URLSearchParams(searchParams);
    if (ai) p.set("mode", "ai"); else p.delete("mode");
    p.set("tab", "people");
    setSearchParams(p, { replace: true });
  };

  return (
    <div className={styles.peopleTab}>
      <div className={styles.modeToggle}>
        <button className={`${styles.modeBtn} ${!isAiMode ? styles.modeBtnActive : ""}`} onClick={() => toggleMode(false)}>Search</button>
        <button className={`${styles.modeBtn} ${isAiMode ? styles.modeBtnActive : ""}`} onClick={() => toggleMode(true)}>AI Match</button>
      </div>

      {isAiMode ? <AIMatchContent /> : <KeywordContent />}
    </div>
  );
}
