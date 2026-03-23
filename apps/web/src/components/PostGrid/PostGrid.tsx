import type { Post } from "@rearden/types";
import { PostCard } from "@/components/PostCard/PostCard";
import styles from "./PostGrid.module.scss";

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No posts yet</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
