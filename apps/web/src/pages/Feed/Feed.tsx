import { useRef, useEffect, useLayoutEffect, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { VideoPost } from "@rearden/types";
import { Heart, ChatCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import { AnimatePresence } from "motion/react";

import { Avatar } from "@/components/Avatar/Avatar";
import { CommentSheet } from "@/components/CommentSheet/CommentSheet";
import { ShareSheet } from "@/components/ShareSheet/ShareSheet";
import { useChatStore } from "@/stores/chatStore";
import { apiFetch } from "@/lib/api";
import styles from "./Feed.module.scss";

const PAGE_SIZE = 5;

interface FeedProps {
  /** Filter by user (enables chronological mode) */
  userId?: string;
  /** Post ID to start from (deep link / reel modal) */
  initialPostId?: string;
  /** Full-screen mode (inside ReelModal — no bottom nav padding) */
  inModal?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function Feed({ userId, initialPostId, inModal }: FeedProps) {
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
  const [scrollReady, setScrollReady] = useState(!postId);

  // Local engagement state
  const [engagement, setEngagement] = useState<
    Record<string, { likeCount: number; commentCount: number; isLiked: boolean }>
  >({});

  // Comment and share sheets
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  // Expandable description
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

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

      if (userId) params.set("userId", userId);

      // Profile reels: load all videos at once (no startFrom filter)
      // so user can scroll both up and down from the clicked post
      if (userId && mode === "initial") {
        params.set("limit", "200");
        return `/posts?${params}`;
      }

      params.set("limit", String(PAGE_SIZE));

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

        // Initialize engagement state
        const initialEngagement: Record<string, { likeCount: number; commentCount: number; isLiked: boolean }> = {};
        res.data.forEach((post) => {
          initialEngagement[post.id] = {
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            isLiked: post.isLiked,
          };
        });
        setEngagement(initialEngagement);

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

      // Update engagement for new posts
      setEngagement((prev) => {
        const updated = { ...prev };
        res.data.forEach((post) => {
          if (!updated[post.id]) {
            updated[post.id] = {
              likeCount: post.likeCount,
              commentCount: post.commentCount,
              isLiked: post.isLiked,
            };
          }
        });
        return updated;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, buildUrl, updatePagination]);

  // Load more when approaching the end (replaces sentinel — scroll-snap blocks sentinel visibility)
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  // Scroll to initial post before paint (hidden until ready to prevent flash)
  useLayoutEffect(() => {
    if (!postId || hasScrolledToInitial.current || posts.length === 0) return;

    const container = containerRef.current;
    const targetIndex = posts.findIndex((p) => p.id === postId);
    if (targetIndex >= 0 && container) {
      hasScrolledToInitial.current = true;
      // Disable smooth scroll for instant jump
      container.style.scrollBehavior = "auto";
      container.scrollTop = targetIndex * container.clientHeight;
      container.style.scrollBehavior = "";
    }
    setScrollReady(true);
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

            // Update URL to reflect current video
            const currentPost = posts[index];
            if (currentPost) {
              if (userId) {
                history.replaceState(null, "", `/user/${userId}/reel/${currentPost.id}`);
              } else if (!initialPostId) {
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

  // Like toggle handler
  const handleLikeToggle = useCallback(async (postId: string) => {
    const currentEngagement = engagement[postId];
    if (!currentEngagement) return;

    const newIsLiked = !currentEngagement.isLiked;
    const delta = newIsLiked ? 1 : -1;

    // Optimistic update
    setEngagement((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isLiked: newIsLiked,
        likeCount: prev[postId].likeCount + delta,
      },
    }));

    try {
      await apiFetch(`/posts/${postId}/like`, { method: "POST" });
    } catch {
      // Revert on error
      setEngagement((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLiked: !newIsLiked,
          likeCount: prev[postId].likeCount - delta,
        },
      }));
    }
  }, [engagement]);

  // Share handler — always open custom ShareSheet
  const handleShare = useCallback((postId: string) => {
    setSharePostId(postId);
  }, []);

  // Comment callbacks
  const handleCommentAdd = useCallback(() => {
    if (!commentPostId) return;
    setEngagement((prev) => ({
      ...prev,
      [commentPostId]: {
        ...prev[commentPostId],
        commentCount: prev[commentPostId].commentCount + 1,
      },
    }));
  }, [commentPostId]);

  const handleCommentDelete = useCallback(() => {
    if (!commentPostId) return;
    setEngagement((prev) => ({
      ...prev,
      [commentPostId]: {
        ...prev[commentPostId],
        commentCount: Math.max(0, prev[commentPostId].commentCount - 1),
      },
    }));
  }, [commentPostId]);

  // Start conversation handler
  const handleStartConversation = useCallback(async (userId: string, userName: string) => {
    const convId = await startConversation(userId, userName);
    if (convId) {
      navigate("/chat");
    }
  }, [startConversation, navigate]);

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
      <div
        className={`${styles.feed} ${inModal ? styles.feedModal : styles.feedStandalone}`}
        ref={containerRef}
        style={scrollReady ? undefined : { visibility: "hidden" }}
      >
        {posts.map((post, i) => {
          const postEngagement = engagement[post.id] ?? {
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            isLiked: post.isLiked,
          };
          const isExpanded = expandedPostId === post.id;

          return (
            <div
              key={post.id}
              className={`${styles.reel} ${inModal ? styles.reelModal : ''}`}
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
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      v.style.objectFit = v.videoHeight >= v.videoWidth ? "cover" : "contain";
                    }}
                    onClick={(e) => {
                      const v = e.currentTarget;
                      v.paused ? v.play() : v.pause();
                    }}
                  />

                  <div className={styles.gradient} />

                  {/* Dark overlay when description expanded */}
                  {isExpanded && (
                    <div
                      className={styles.dimOverlay}
                      onClick={() => setExpandedPostId(null)}
                    />
                  )}

                  {/* Bottom-left info */}
                  <div className={styles.bottomInfo}>
                    <div className={styles.authorRow}>
                      <Avatar
                        src={post.author.thumbnailUrl}
                        name={post.author.name}
                        size="sm"
                      />
                      <button
                        className={styles.authorNameLink}
                        onClick={() => navigate(`/user/${post.author.id}`)}
                      >
                        {post.author.name}
                      </button>
                      <button
                        className={styles.chatPill}
                        onClick={() => handleStartConversation(post.author.id, post.author.name)}
                      >
                        Chat
                      </button>
                    </div>

                    {/* Description */}
                    {post.content && (
                      <div>
                        <p className={isExpanded ? styles.descriptionExpanded : styles.descriptionCollapsed}>
                          {post.content}
                        </p>
                        {!isExpanded && post.content.length > 80 && (
                          <button
                            className={styles.moreBtn}
                            onClick={() => setExpandedPostId(post.id)}
                          >
                            ...more
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right sidebar actions */}
                  <div className={styles.reelActions}>
                    {/* Like */}
                    <button
                      className={styles.reelActionBtn}
                      onClick={() => handleLikeToggle(post.id)}
                      aria-label={postEngagement.isLiked ? "Unlike" : "Like"}
                    >
                      <Heart
                        size={32}
                        weight={postEngagement.isLiked ? "fill" : "bold"}
                        className={postEngagement.isLiked ? styles.liked : undefined}
                      />
                      <span className={styles.reelActionCount}>
                        {formatCount(postEngagement.likeCount)}
                      </span>
                    </button>

                    {/* Comment */}
                    <button
                      className={styles.reelActionBtn}
                      onClick={() => setCommentPostId(post.id)}
                      aria-label="Comment"
                    >
                      <ChatCircle size={32} weight="bold" />
                      <span className={styles.reelActionCount}>
                        {formatCount(postEngagement.commentCount)}
                      </span>
                    </button>

                    {/* Share */}
                    <button
                      className={styles.reelActionBtn}
                      onClick={() => handleShare(post.id)}
                      aria-label="Share"
                    >
                      <PaperPlaneTilt size={32} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

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

      {/* Comment Sheet */}
      <AnimatePresence>
        {commentPostId && (
          <CommentSheet
            postId={commentPostId}
            onClose={() => setCommentPostId(null)}
          />
        )}
      </AnimatePresence>

      {/* Share Sheet */}
      <AnimatePresence>
        {sharePostId && (
          <ShareSheet
            postId={sharePostId}
            onClose={() => setSharePostId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
