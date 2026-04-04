import { SearchBar } from "@/components/SearchBar/SearchBar";
import { ExploreGrid } from "@/components/ExploreGrid/ExploreGrid";
import { usePostSearch } from "@/hooks/usePostSearch";
import styles from "./SearchContentTab.module.scss";

export function SearchContentTab() {
  const { query, setQuery, results, loading } = usePostSearch();

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

      {loading && results.length === 0 ? (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.skeletonTile} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <ExploreGrid posts={results} />
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
    </div>
  );
}
