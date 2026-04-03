import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { FeedPost } from "@/components/FeedPost/FeedPost";
import { CommentSheet } from "@/components/CommentSheet/CommentSheet";
import { PostDetailModal } from "@/components/PostDetailModal/PostDetailModal";
import { useFeedStore } from "@/stores/feedStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./Home.module.scss";

export function Home() {
  const { posts, loading, loadingMore, hasMore, error, fetchFeed, loadMore } =
    useFeedStore();
  const [modalState, setModalState] = useState<{ postId: string; focusComments: boolean } | null>(null);
  const [mobileCommentPostId, setMobileCommentPostId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const loadingMoreRef = useRef(loadingMore);
  loadingMoreRef.current = loadingMore;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMoreRef.current && hasMoreRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleOpenComments = (postId: string) => {
    if (isMobile) {
      setMobileCommentPostId(postId);
    } else {
      setModalState({ postId, focusComments: true });
    }
  };

  const handleOpenPost = (postId: string) => {
    if (!isMobile) {
      setModalState({ postId, focusComments: false });
    }
  };

  const handleCloseModal = () => setModalState(null);
  const handleCloseSheet = () => setMobileCommentPostId(null);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No posts yet</div>
      </div>
    );
  }

  const modalPost = modalState ? posts.find((p) => p.id === modalState.postId) : null;

  return (
    <div className={styles.container}>
      <div className={styles.feed}>
        {posts.map((post) => (
          <FeedPost
            key={post.id}
            post={post}
            onOpenComments={handleOpenComments}
            onClickMedia={handleOpenPost}
          />
        ))}

        {hasMore && (
          <div ref={sentinelRef} className={styles.sentinel}>
            {loadingMore && <div className={styles.spinner} />}
          </div>
        )}
      </div>

      <AnimatePresence>
        {!isMobile && modalState && modalPost && (
          <PostDetailModal
            key={modalPost.id}
            post={modalPost}
            focusComments={modalState.focusComments}
            onClose={handleCloseModal}
          />
        )}
        {isMobile && mobileCommentPostId && (
          <CommentSheet
            key={mobileCommentPostId}
            postId={mobileCommentPostId}
            onClose={handleCloseSheet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
