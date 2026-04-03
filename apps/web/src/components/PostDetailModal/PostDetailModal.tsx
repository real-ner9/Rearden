import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import type { FeedPost } from "@rearden/types";
import { Avatar } from "@/components/Avatar/Avatar";
import { CommentItem } from "@/components/CommentItem/CommentItem";
import { ModalOverlay } from "@/components/ModalOverlay/ModalOverlay";
import { timeAgo } from "@/utils/timeAgo";
import { useComments } from "@/hooks/useComments";
import { useFeedStore } from "@/stores/feedStore";
import styles from "./PostDetailModal.module.scss";

// Inline ImageCarousel component
interface ImageCarouselProps {
  urls: string[];
  alt?: string;
  onDoubleClick?: () => void;
}

function ImageCarousel({ urls, alt = "", onDoubleClick }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    if (urls.length <= 1) return;

    const observers = imageRefs.current.map((img, index) => {
      if (!img) return null;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setCurrentIndex(index);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(img);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [urls.length]);

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <img
        src={urls[0]}
        alt={alt}
        onDoubleClick={onDoubleClick}
      />
    );
  }

  return (
    <div className={styles.carousel} onDoubleClick={onDoubleClick}>
      <div className={styles.carouselTrack}>
        {urls.map((url, index) => (
          <img
            key={index}
            ref={(el) => {
              imageRefs.current[index] = el;
            }}
            src={url}
            alt={`${alt} ${index + 1}`}
            className={styles.carouselImage}
          />
        ))}
      </div>
      <div className={styles.carouselDots}>
        {urls.map((_, index) => (
          <div
            key={index}
            className={`${styles.carouselDot} ${index === currentIndex ? styles.carouselDotActive : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

interface PostDetailModalProps {
  post: FeedPost;
  focusComments?: boolean;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
}

export function PostDetailModal({ post, focusComments = false, onClose, onLike, onBookmark }: PostDetailModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const feedPost = useFeedStore((s) => s.posts.find((p) => p.id === post.id));
  const feedToggleLike = useFeedStore((s) => s.toggleLike);
  const feedToggleBookmark = useFeedStore((s) => s.toggleBookmark);

  const currentPost = onLike ? post : (feedPost ?? post);
  const toggleLike = onLike ?? feedToggleLike;
  const toggleBookmark = onBookmark ?? feedToggleBookmark;

  const {
    comments,
    loading,
    loadingMore,
    hasMore,
    error,
    newCommentText,
    submitting,
    setNewCommentText,
    loadMore,
    submitComment,
    deleteComment,
    canDeleteComment,
  } = useComments(post.id);

  // Auto-focus comment input if requested
  useEffect(() => {
    if (focusComments && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [focusComments]);

  // Video autoplay
  useEffect(() => {
    if (currentPost.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [currentPost.type]);

  // Infinite scroll for comments
  useEffect(() => {
    if (!commentsListRef.current) return;

    const handleScroll = () => {
      const list = commentsListRef.current;
      if (!list || loadingMore || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = list;
      if (scrollHeight - scrollTop - clientHeight < 300) {
        loadMore();
      }
    };

    const list = commentsListRef.current;
    list.addEventListener("scroll", handleScroll);
    return () => list.removeEventListener("scroll", handleScroll);
  }, [loadMore, loadingMore, hasMore]);

  const handleDoubleTap = () => {
    if (!currentPost.isLiked) {
      toggleLike(currentPost.id);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitComment();
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  const renderHashtags = (text: string, hashtags: string[]) => {
    let result = text;
    hashtags.forEach((tag) => {
      const regex = new RegExp(`(#${tag})`, "gi");
      result = result.replace(regex, `<span class="${styles.hashtag}">$1</span>`);
    });
    return { __html: result };
  };

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className={styles.mediaPanel}>
          {currentPost.type === "image" && (currentPost.imageUrls?.length || currentPost.imageUrl) && (
            <div className={styles.mediaWrapper}>
              <ImageCarousel
                urls={currentPost.imageUrls?.length ? currentPost.imageUrls : [currentPost.imageUrl!]}
                alt={currentPost.content}
                onDoubleClick={handleDoubleTap}
              />
              <AnimatePresence>
                {showHeartAnimation && (
                  <motion.div
                    className={styles.heartOverlay}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {currentPost.type === "video" && currentPost.videoUrl && (
            <div className={styles.mediaWrapper} onDoubleClick={handleDoubleTap}>
              <video
                ref={videoRef}
                src={currentPost.videoUrl}
                loop
                muted
                playsInline
                poster={currentPost.thumbnailUrl || undefined}
                onClick={handleVideoClick}
              />
              <AnimatePresence>
                {showHeartAnimation && (
                  <motion.div
                    className={styles.heartOverlay}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {currentPost.type === "text" && (
            <div className={styles.textContent}>
              <p>{currentPost.content}</p>
            </div>
          )}
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.authorHeader}>
            <Avatar
              src={currentPost.author.thumbnailUrl}
              name={currentPost.author.name}
              size="md"
            />
            <div className={styles.authorInfo}>
              <Link to={`/user/${currentPost.author.id}`} className={styles.username}>
                {currentPost.author.username || currentPost.author.name || "Anonymous"}
              </Link>
              <span className={styles.time}>{timeAgo(currentPost.createdAt)}</span>
            </div>
          </div>

          {(currentPost.content || currentPost.hashtags.length > 0) && currentPost.type !== "text" && (
            <div className={styles.caption}>
              <Link to={`/user/${currentPost.author.id}`} className={styles.captionUsername}>
                {currentPost.author.username || currentPost.author.name || "Anonymous"}
              </Link>
              <span
                dangerouslySetInnerHTML={renderHashtags(currentPost.content, currentPost.hashtags)}
              />
            </div>
          )}

          <div className={styles.commentsList} ref={commentsListRef}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner} />
              </div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : comments.length === 0 ? (
              <div className={styles.empty}>No comments yet. Be the first!</div>
            ) : (
              <>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onDelete={canDeleteComment(comment) ? deleteComment : undefined}
                  />
                ))}
                {loadingMore && (
                  <div className={styles.loadingMore}>
                    <div className={styles.spinner} />
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.actionBar}>
            <button
              className={`${styles.actionButton} ${currentPost.isLiked ? styles.liked : ""}`}
              onClick={() => toggleLike(currentPost.id)}
              aria-label={currentPost.isLiked ? "Unlike" : "Like"}
            >
              {currentPost.isLiked ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
            </button>

            <button className={styles.actionButton} aria-label="Comment">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <button className={styles.actionButton} aria-label="Share">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>

            <button
              className={`${styles.actionButton} ${styles.bookmarkButton} ${currentPost.isBookmarked ? styles.bookmarked : ""}`}
              onClick={() => toggleBookmark(currentPost.id)}
              aria-label={currentPost.isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {currentPost.isBookmarked ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              )}
            </button>
          </div>

          <div className={styles.likeCount}>
            {currentPost.likeCount} {currentPost.likeCount === 1 ? "like" : "likes"}
          </div>

          <form className={styles.commentInput} onSubmit={handleCommentSubmit}>
            <textarea
              ref={commentInputRef}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              placeholder="Add a comment..."
              disabled={submitting}
              rows={1}
            />
            <button
              type="submit"
              disabled={!newCommentText.trim() || submitting}
              className={styles.postButton}
            >
              {submitting ? "Posting..." : "Post"}
            </button>
          </form>
        </div>
      </motion.div>
    </ModalOverlay>
  );
}
