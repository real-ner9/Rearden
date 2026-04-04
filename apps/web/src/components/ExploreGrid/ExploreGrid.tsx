import { ExploreTile, type ExploreTilePost } from "./ExploreTile";
import styles from "./ExploreGrid.module.scss";

interface ExploreGridProps {
  posts: ExploreTilePost[];
}

export function ExploreGrid({ posts }: ExploreGridProps) {
  return (
    <div className={styles.grid}>
      {posts.map((post, index) => (
        <ExploreTile
          key={post.id}
          post={post}
          large={(index + 1) % 7 === 0}
        />
      ))}
    </div>
  );
}
