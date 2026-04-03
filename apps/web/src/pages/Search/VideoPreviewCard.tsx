import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { PostSearchResult } from "@rearden/types";
import styles from "./VideoPreviewCard.module.scss";

interface VideoPreviewCardProps {
  post: PostSearchResult;
  onClick: () => void;
}

export function VideoPreviewCard({ post, onClick }: VideoPreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleImgError = useCallback(() => setImgError(true), []);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHovered(false);
  };

  return (
    <div
      className={styles.videoCard}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.mediaContainer}>
        {!imgError ? (
          <img
            src={post.thumbnailUrl || "/placeholder-video.jpg"}
            alt={post.content.substring(0, 50)}
            className={styles.thumbnail}
            onError={handleImgError}
          />
        ) : (
          <div className={styles.thumbnailFallback}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M10 8l6 4-6 4V8z" />
            </svg>
          </div>
        )}

        <AnimatePresence>
          {isHovered && post.videoUrl && (
            <motion.video
              src={post.videoUrl}
              className={styles.video}
              autoPlay
              muted
              loop
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {!isHovered && (
          <div className={styles.playIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>

      <div className={styles.cardContent}>
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
    </div>
  );
}
