import type { Post } from "@rearden/types";
import styles from "./PostCard.module.scss";

interface PostCardProps {
  post: Post;
}

function formatContent(content: string) {
  const parts = content.split(/(#\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className={styles.hashtag}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className={styles.card}>
      <p className={styles.content}>{formatContent(post.content)}</p>
      <span className={styles.time}>{timeAgo(post.createdAt)}</span>
    </div>
  );
}
