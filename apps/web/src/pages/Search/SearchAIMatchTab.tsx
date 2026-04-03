import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { UserCard } from "@/components/UserCard/UserCard";
import { useSearch } from "@/hooks/useSearch";
import styles from "./SearchAIMatchTab.module.scss";

const SUGGESTIONS = [
  "Fullstack dev, React + Node, 5+ years",
  "UX designer with Figma experience",
  "DevOps engineer, AWS & Kubernetes",
  "Mobile developer, React Native or Flutter",
  "ML engineer with PyTorch, CV background",
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export function SearchAIMatchTab() {
  const navigate = useNavigate();
  const { query, setQuery, results, loading } = useSearch();
  const [textareaValue, setTextareaValue] = useState("");

  const handleSubmit = () => {
    if (textareaValue.trim()) {
      setQuery(textareaValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (text: string) => {
    setTextareaValue(text);
    setQuery(text);
  };

  const showResults = !!query;

  return (
    <div className={styles.aiTab}>
      {!showResults && (
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className={styles.heroTitle}>AI Match</h2>
          <p className={styles.heroSubtitle}>
            Describe who you're looking for and let AI find the best candidates
          </p>
        </div>
      )}

      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            className={styles.textarea}
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your ideal candidate..."
            rows={3}
          />
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!textareaValue.trim() || loading}
            aria-label="Search"
          >
            {loading ? (
              <div className={styles.btnSpinner} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>

        {!showResults && (
          <div className={styles.suggestions}>
            <span className={styles.suggestionsLabel}>Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className={styles.chip}
                onClick={() => handleSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {showResults && (
        <>
          {loading && results.length === 0 ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeleton}>
                  <div className={styles.skeletonThumb} />
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonLine} style={{ width: "60%" }} />
                    <div className={styles.skeletonLine} style={{ width: "40%" }} />
                    <div className={styles.skeletonLine} style={{ width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className={styles.statsBar}>
                {results.length} match{results.length !== 1 ? "es" : ""} found
              </div>
              <motion.div
                className={styles.grid}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={query}
              >
                {results.map((result) => (
                  <motion.div key={result.userId} variants={cardVariants}>
                    <UserCard
                      user={result.user}
                      score={result.score}
                      matchReason={result.matchReason}
                      onClick={() => navigate(`/user/${result.userId}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : (
            !loading && (
              <div className={styles.empty}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
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
