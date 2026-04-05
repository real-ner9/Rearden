import { Link } from "react-router-dom";
import { Heart } from "@phosphor-icons/react";
import type { PostComment } from "@rearden/types";
import { Avatar } from "@/components/Avatar/Avatar";
import { timeAgo } from "@/utils/timeAgo";
import styles from "./CommentItem.module.scss";

interface CommentItemProps {
  comment: PostComment;
  onDelete?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, onDelete, onReply, onLike, isReply }: CommentItemProps) {
  return (
    <div className={`${styles.comment} ${isReply ? styles.reply : ""}`}>
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
          {onReply && !isReply && (
            <>
              <span className={styles.dot}>·</span>
              <button className={styles.replyButton} onClick={() => onReply(comment.id)}>
                Reply
              </button>
            </>
          )}
        </div>
        <p className={styles.text}>{comment.text}</p>
      </div>

      <div className={styles.actions}>
        {onLike && (
          <button
            className={`${styles.likeButton} ${comment.isLiked ? styles.likeButtonActive : ""}`}
            onClick={() => onLike(comment.id)}
            aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
          >
            <Heart size={14} weight={comment.isLiked ? "fill" : "regular"} />
            {(comment.likeCount ?? 0) > 0 && (
              <span className={styles.likeCount}>{comment.likeCount}</span>
            )}
          </button>
        )}
        {onDelete && (
          <button
            className={styles.deleteButton}
            onClick={() => onDelete(comment.id)}
            aria-label="Delete comment"
          >
            <svg
              width="14"
              height="14"
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
    </div>
  );
}
