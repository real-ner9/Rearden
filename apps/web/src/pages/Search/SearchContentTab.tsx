import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { ReelModal } from "@/components/ReelModal/ReelModal";
import { usePostSearch } from "@/hooks/usePostSearch";
import { useTrending } from "@/hooks/useTrending";
import { VideoPreviewCard } from "./VideoPreviewCard";
import styles from "./SearchContentTab.module.scss";

const FILTER_OPTIONS = [
  { id: null, label: "All" },
  { id: "video" as const, label: "Video" },
  { id: "text" as const, label: "Text" },
  { id: "image" as const, label: "Image" },
];

export function SearchContentTab() {
  const navigate = useNavigate();
  const { query, setQuery, results, loading, typeFilter, setTypeFilter } = usePostSearch();
  const { hashtags, loading: trendingLoading } = useTrending();
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const handleHashtagClick = (tag: string) => {
    setQuery(`#${tag}`);
  };

  return (
    <div className={styles.contentTab}>
      <SearchBar
        value={query}
        onChange={setQuery}
        loading={loading && results.length === 0}
        placeholders={[
          "Search posts, #hashtags, creators...",
          "Find video content...",
          "Explore trending topics...",
        ]}
      />

      <div className={styles.filters}>
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id || "all"}
            className={`${styles.filterChip} ${typeFilter === option.id ? styles.active : ""}`}
            onClick={() => setTypeFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Trending section — show when no query */}
      {!query && (
        <motion.div
          className={styles.trendingSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className={styles.trendingTitle}>Trending</h2>
          <div className={styles.trendingChips}>
            {trendingLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skeletonChip} />
              ))
            ) : (
              hashtags.map((item, i) => (
                <button
                  key={i}
                  className={styles.trendingChip}
                  onClick={() => handleHashtagClick(item.tag)}
                >
                  <span>#{item.tag}</span>
                  <span className={styles.trendingCount}>{item.count}</span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Popular / search results heading */}
      {!query && results.length > 0 && (
        <h3 className={styles.sectionTitle}>Popular</h3>
      )}

      {loading && results.length === 0 ? (
        <div className={styles.postsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skeletonThumb} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonLine} style={{ width: "70%" }} />
                <div className={styles.skeletonLine} style={{ width: "50%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <motion.div
          className={styles.postsGrid}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {results.map((post) => (
            <motion.div
              key={post.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              {post.type === "video" ? (
                <VideoPreviewCard post={post} onClick={() => setActivePostId(post.id)} />
              ) : (
                <div className={styles.textPostCard} onClick={() => navigate(`/user/${post.user.id}`)}>
                  <p className={styles.postContent}>{post.content}</p>
                  <div className={styles.authorRow}>
                    <img
                      src={post.user.thumbnailUrl || "/placeholder-avatar.jpg"}
                      alt={post.user.name || post.user.username || "User"}
                      className={styles.authorAvatar}
                    />
                    <span className={styles.authorName}>
                      {post.user.name || post.user.username || "Anonymous"}
                    </span>
                    {post.user.username && post.user.name && (
                      <span className={styles.authorUsername}>@{post.user.username}</span>
                    )}
                  </div>
                  {post.hashtags.length > 0 && (
                    <div className={styles.hashtags}>
                      {post.hashtags.map((tag, i) => (
                        <span key={i} className={styles.hashtagChip}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        query &&
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
            <p>No posts found</p>
          </div>
        )
      )}
      <AnimatePresence>
        {activePostId && (
          <ReelModal
            initialPostId={activePostId}
            onClose={() => setActivePostId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
