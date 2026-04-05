import { useRef, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import type { FeedPost as FeedPostType } from "@rearden/types";
import { Avatar } from "@/components/Avatar/Avatar";
import { timeAgo } from "@/utils/timeAgo";
import { useAuthStore } from "@/stores/authStore";
import { useFeedStore } from "@/stores/feedStore";
import styles from "./FeedPost.module.scss";

interface FeedPostProps {
  post: FeedPostType;
  onOpenComments: (postId: string) => void;
  onClickMedia?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

// Inline ImageCarousel component
interface ImageCarouselProps {
  urls: string[];
  alt?: string;
}

function ImageCarousel({ urls, alt = "" }: ImageCarouselProps) {
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
    return <img src={urls[0]} alt={alt} className={styles.image} />;
  }

  return (
    <div className={styles.carousel}>
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

export function FeedPost({ post, onOpenComments, onClickMedia, onLike, onBookmark, onShare }: FeedPostProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const user = useAuthStore((state) => state.user);
  const feedToggleLike = useFeedStore((state) => state.toggleLike);
  const feedToggleBookmark = useFeedStore((state) => state.toggleBookmark);

  useEffect(() => {
    if (post.type !== "video" || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [post.type]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  const handleDoubleTap = () => {
    if (!post.isLiked) {
      handleLike();
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  const handleMediaClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleDoubleTap();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        onClickMedia?.(post.id);
      }, 250);
    }
  };

  const handleLike = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    (onLike ?? feedToggleLike)(post.id);
  };

  const handleComment = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    onOpenComments(post.id);
  };

  const handleBookmark = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    (onBookmark ?? feedToggleBookmark)(post.id);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(post.id);
    }
  };

  const [captionExpanded, setCaptionExpanded] = useState(false);

  const renderCaption = (text: string) => {
    let result = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // @mentions → clickable links to search people
    result = result.replace(
      /@(\w+)/g,
      `<a class="${styles.mention}" data-mention="$1">@$1</a>`
    );

    // #hashtags → clickable links to search
    result = result.replace(
      /#(\w+)/g,
      `<a class="${styles.hashtag}" data-hashtag="$1">#$1</a>`
    );

    return { __html: result };
  };

  const handleCaptionClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const hashtag = target.dataset?.hashtag;
    const mention = target.dataset?.mention;
    if (hashtag) {
      e.preventDefault();
      navigate(`/search?tab=content&q=${encodeURIComponent("#" + hashtag)}`);
    } else if (mention) {
      e.preventDefault();
      navigate(`/search?tab=people&q=${encodeURIComponent(mention)}`);
    }
  };

  const captionText = post.content || "";
  const shouldCollapse = captionText.length > 120;

  return (
    <article className={styles.post}>
      <header className={styles.header}>
        <Avatar
          src={post.author.thumbnailUrl}
          name={post.author.name}
          size="md"
          onClick={() => navigate(`/user/${post.author.id}`)}
        />
        <div className={styles.headerInfo}>
          <Link to={`/user/${post.author.id}`} className={styles.username}>
            {post.author.username || post.author.name || "Anonymous"}
          </Link>
          <span className={styles.dot}>·</span>
          <span className={styles.time}>{timeAgo(post.createdAt)}</span>
        </div>
      </header>

      <div className={styles.mediaWrapper} ref={mediaRef} onClick={handleMediaClick}>
        {post.type === "image" && (post.imageUrls?.length || post.imageUrl) && (
          <ImageCarousel
            urls={post.imageUrls?.length ? post.imageUrls : [post.imageUrl!]}
            alt={post.content}
          />
        )}

        {post.type === "video" && post.videoUrl && (
          <video
            ref={videoRef}
            src={post.videoUrl}
            className={styles.video}
            loop
            muted
            playsInline
            poster={post.thumbnailUrl || undefined}
          />
        )}

        {post.type === "text" && (
          <div className={styles.textContent}>
            <p>{post.content}</p>
          </div>
        )}

        <AnimatePresence>
          {showHeartAnimation && (
            <motion.div
              className={styles.heartOverlay}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${post.isLiked ? styles.liked : ""}`}
          onClick={handleLike}
          aria-label={post.isLiked ? "Unlike" : "Like"}
        >
          {post.isLiked ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          )}
          <span>{post.likeCount}</span>
        </button>

        <button
          className={styles.actionButton}
          onClick={handleComment}
          aria-label="Comment"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.commentCount}</span>
        </button>

        <button
          className={styles.actionButton}
          onClick={handleShare}
          aria-label="Share"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        <button
          className={`${styles.actionButton} ${styles.bookmarkButton} ${post.isBookmarked ? styles.bookmarked : ""}`}
          onClick={handleBookmark}
          aria-label={post.isBookmarked ? "Remove bookmark" : "Bookmark"}
        >
          {post.isBookmarked ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>

      {captionText && post.type !== "text" && (
        <div className={styles.caption} onClick={handleCaptionClick}>
          <Link to={`/user/${post.author.id}`} className={styles.captionUsername}>
            {post.author.username || post.author.name || "Anonymous"}
          </Link>
          {shouldCollapse && !captionExpanded ? (
            <>
              <span
                className={styles.captionCollapsed}
                dangerouslySetInnerHTML={renderCaption(captionText.slice(0, 120))}
              />
              <button
                className={styles.moreBtn}
                onClick={(e) => { e.stopPropagation(); setCaptionExpanded(true); }}
              >
                ...more
              </button>
            </>
          ) : (
            <span dangerouslySetInnerHTML={renderCaption(captionText)} />
          )}
        </div>
      )}

      {post.commentCount > 0 && (
        <button className={styles.viewComments} onClick={handleComment}>
          View all {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
        </button>
      )}

    </article>
  );
}
