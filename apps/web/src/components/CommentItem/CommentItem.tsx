import { Link } from "react-router-dom";
import type { PostComment } from "@rearden/types";
import { Avatar } from "@/components/Avatar/Avatar";
import { timeAgo } from "@/utils/timeAgo";
import styles from "./CommentItem.module.scss";

interface CommentItemProps {
  comment: PostComment;
  onDelete?: (commentId: string) => void;
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <div className={styles.comment}>
      <Avatar
        src={comment.author.thumbnailUrl}
        name={comment.author.name}
        size="sm"
      />
      <div className={styles.content}>
        <div className={styles.header}>
          <Link to={`/user/${comment.userId}`} className={styles.username}>
            {comment.author.username || comment.author.name || "Anonymous"}
          </Link>
          <span className={styles.dot}>·</span>
          <span className={styles.time}>{timeAgo(comment.createdAt)}</span>
        </div>
        <p className={styles.text}>{comment.text}</p>
      </div>
      {onDelete && (
        <button
          className={styles.deleteButton}
          onClick={() => onDelete(comment.id)}
          aria-label="Delete comment"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      )}
    </div>
  );
}
