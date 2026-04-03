import { useRef, useEffect, useLayoutEffect, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { VideoPost } from "@rearden/types";

import { useChatStore } from "@/stores/chatStore";
import { apiFetch } from "@/lib/api";
import styles from "./Feed.module.scss";

const PAGE_SIZE = 5;

interface FeedProps {
  /** Filter by user (enables chronological mode) */
  userId?: string;
  /** Post ID to start from (deep link / reel modal) */
  initialPostId?: string;
}

export function Feed({ userId, initialPostId }: FeedProps) {
  const navigate = useNavigate();
  const { postId: routePostId } = useParams<{ postId?: string }>();
  const postId = initialPostId ?? routePostId;
  const startConversation = useChatStore((s) => s.startConversation);

  // Shuffled mode for main feed, chronological for user reels
  const shuffled = !userId;
  const [seed] = useState(() => crypto.randomUUID());

  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination refs (not state — no re-render needed)
  const offsetRef = useRef(0);
  const cursorRef = useRef<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const hasScrolledToInitial = useRef(false);

  // Build fetch URL
  const buildUrl = useCallback(
    (mode: "initial" | "more") => {
      const params = new URLSearchParams();
      params.set("type", "video");
      params.set("limit", String(PAGE_SIZE));

      if (userId) params.set("userId", userId);

      if (shuffled) {
        params.set("seed", seed);
        params.set("offset", String(mode === "more" ? offsetRef.current : 0));
        if (postId) params.set("startFrom", postId);
      } else {
        if (mode === "more" && cursorRef.current) {
          params.set("cursor", cursorRef.current);
        } else if (postId) {
          params.set("startFrom", postId);
        }
      }

      return `/posts?${params}`;
    },
    [userId, shuffled, seed, postId]
  );

  // Parse pagination from response meta
  const updatePagination = useCallback(
    (meta?: Record<string, unknown>) => {
      if (shuffled) {
        offsetRef.current = (meta?.nextOffset as number) ?? offsetRef.current;
        setHasMore((meta?.hasMore as boolean) ?? false);
      } else {
        cursorRef.current = (meta?.nextCursor as string) ?? null;
        setHasMore(!!meta?.nextCursor);
      }
    },
    [shuffled]
  );

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    offsetRef.current = 0;
    cursorRef.current = null;

    apiFetch<{ success: boolean; data: VideoPost[]; meta?: Record<string, unknown> }>(
      buildUrl("initial")
    )
      .then((res) => {
        if (cancelled) return;
        setPosts(res.data);
        updatePagination(res.meta);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildUrl, updatePagination]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await apiFetch<{
        success: boolean;
        data: VideoPost[];
        meta?: Record<string, unknown>;
      }>(buildUrl("more"));

      setPosts((prev) => [...prev, ...res.data]);
      updatePagination(res.meta);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, buildUrl, updatePagination]);

  // Load more when approaching the end (replaces sentinel — scroll-snap blocks sentinel visibility)
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  // Scroll to initial post before paint
  useLayoutEffect(() => {
    if (!postId || hasScrolledToInitial.current || posts.length === 0) return;

    const container = containerRef.current;
    const targetIndex = posts.findIndex((p) => p.id === postId);
    if (targetIndex >= 0 && container) {
      hasScrolledToInitial.current = true;
      container.scrollTop = targetIndex * container.clientHeight;
    }
  }, [postId, posts]);

  // IntersectionObserver: autoplay visible, pause hidden, update URL
  const prevActiveRef = useRef(-1);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    videoRefs.current = videoRefs.current.slice(0, posts.length);

    const updatePreload = (activeIdx: number) => {
      const start = Math.max(0, activeIdx - 4);
      const end = Math.min(videoRefs.current.length - 1, activeIdx + 4);
      for (let i = start; i <= end; i++) {
        const v = videoRefs.current[i];
        if (v) v.preload = Math.abs(i - activeIdx) <= 2 ? "auto" : "none";
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index);
          const video = videoRefs.current[index];
          if (!video) continue;

          if (entry.isIntersecting) {
            activeIndexRef.current = index;
            video.currentTime = 0;
            video.play().catch(() => {});

            // Update URL (standalone feed only)
            if (!initialPostId && !userId) {
              const currentPost = posts[index];
              if (currentPost) {
                history.replaceState(null, "", `/feed/${currentPost.id}`);
              }
            }
          } else {
            video.pause();
          }
        }

        // Preload only ±4 from active (optimize by checking if active changed)
        const active = activeIndexRef.current;
        if (active !== prevActiveRef.current) {
          updatePreload(active);
          prevActiveRef.current = active;
        }

        // Load more when within 2 reels of the end
        if (hasMoreRef.current && active >= posts.length - 3) {
          loadMoreRef.current();
        }
      },
      { root: container, threshold: 0.5 }
    );

    reelRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [posts, initialPostId, userId]);

  // Keyboard navigation
  const handleKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  handleKeyDownRef.current = (e: KeyboardEvent) => {
    if (posts.length === 0) return;

    const el = document.activeElement as HTMLElement;
    if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.tagName === 'SELECT' || el?.isContentEditable) return;

    let nextIndex: number | null = null;
    if (e.key === "ArrowDown" || e.key === "j") {
      nextIndex = Math.min(activeIndexRef.current + 1, posts.length - 1);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      nextIndex = Math.max(activeIndexRef.current - 1, 0);
    }

    if (nextIndex !== null && nextIndex !== activeIndexRef.current) {
      reelRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDownRef.current?.(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const scrollUp = useCallback(() => {
    const nextIndex = Math.max(activeIndexRef.current - 1, 0);
    if (nextIndex !== activeIndexRef.current) {
      reelRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const scrollDown = useCallback(() => {
    const nextIndex = Math.min(activeIndexRef.current + 1, posts.length - 1);
    if (nextIndex !== activeIndexRef.current) {
      reelRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth" });
    }
  }, [posts.length]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No video reels yet</p>
      </div>
    );
  }

  return (
    <>
    <div className={styles.feed} ref={containerRef}>
      {posts.map((post, i) => (
        <div
          key={post.id}
          className={styles.reel}
          data-index={i}
          ref={(el) => {
            reelRefs.current[i] = el;
          }}
        >
          <div className={styles.reelCard}>
            <div className={styles.videoWrapper}>
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                className={styles.video}
                src={post.videoUrl}
                poster={post.thumbnailUrl ?? undefined}
                preload={i < 3 ? "auto" : "none"}
                loop
                muted
                playsInline
                onClick={(e) => {
                  const v = e.currentTarget;
                  v.paused ? v.play() : v.pause();
                }}
              />

              <div className={styles.gradient} />

              <div className={styles.overlay}>
                <button
                  className={styles.authorName}
                  onClick={() => navigate(`/user/${post.author.id}`)}
                >
                  {post.author.name}
                </button>
                <p className={styles.authorTitle}>{post.author.title}</p>
                <p className={styles.authorLocation}>
                  {post.author.location} &middot; {post.author.experience}yr exp
                </p>
                <div className={styles.authorSkills}>
                  {post.author.skills.slice(0, 4).map((s) => (
                    <span key={s} className={styles.skillChip}>
                      #{s.toLowerCase().replace(/\s+/g, "")}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.actionBtn}
                onClick={() => navigate(`/user/${post.author.id}`)}
                title="View profile"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className={styles.actionLabel}>Profile</span>
              </button>

              <button
                className={styles.actionBtn}
                onClick={() => startConversation(post.author.id, post.author.name)}
                title="Message"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className={styles.actionLabel}>Chat</span>
              </button>

              {post.author.resumeText && (
                <button
                  className={styles.actionBtn}
                  onClick={() => navigate(`/user/${post.author.id}/resume`)}
                  title="Resume"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className={styles.actionLabel}>CV</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {loadingMore && (
        <div className={styles.sentinel}>
          <div className={styles.spinner} />
        </div>
      )}
    </div>

    <div className={styles.scrollButtons}>
      <button className={styles.scrollBtn} onClick={scrollUp} aria-label="Previous reel">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <button className={styles.scrollBtn} onClick={scrollDown} aria-label="Next reel">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
    </>
  );
}
