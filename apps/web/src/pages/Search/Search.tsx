import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

import { SearchBar } from "@/components/SearchBar/SearchBar";
import { CandidateCard } from "@/components/CandidateCard/CandidateCard";
import { useSearch } from "@/hooks/useSearch";
import styles from "./Search.module.scss";

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

export function Search() {
  const navigate = useNavigate();
  const { query, setQuery, results, loading, error } = useSearch();

  return (
    <div className={styles.search}>
        <div className={styles.header}>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {query ? "Search Results" : "Discover Talent"}
          </motion.h1>
          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          >
            {query
              ? `${results.length} candidate${results.length !== 1 ? "s" : ""} found`
              : "Use AI-powered search to find your perfect candidates"}
          </motion.p>
        </div>

        <div className={styles.searchWrapper}>
          <SearchBar value={query} onChange={setQuery} loading={loading} />
        </div>

        {error && (
          <div className={styles.error}>
            <p>Something went wrong: {error}</p>
          </div>
        )}

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
          <motion.div
            className={styles.grid}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={query}
          >
            {results.map((result) => (
              <motion.div key={result.candidateId} variants={cardVariants}>
                <CandidateCard
                  candidate={result.candidate}
                  score={result.score}
                  matchReason={result.matchReason}
                  onClick={() => navigate(`/candidate/${result.candidateId}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          !loading && (
            <motion.div
              className={styles.empty}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <h3>No candidates found</h3>
              <p>Try adjusting your search query</p>
            </motion.div>
          )
        )}
      </div>
  );
}
