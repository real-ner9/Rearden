import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import type { FeedPost as FeedPostType } from "@rearden/types";
import { FeedPost } from "@/components/FeedPost/FeedPost";
import { CommentSheet } from "@/components/CommentSheet/CommentSheet";
import { ExploreGrid } from "@/components/ExploreGrid/ExploreGrid";
import { useFeedStore } from "@/stores/feedStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { apiFetch } from "@/lib/api";
import styles from "./PostDetail.module.scss";

interface SinglePostResponse {
  success: boolean;
  data: FeedPostType;
}

export function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const feedPosts = useFeedStore((s) => s.posts);
  const fetchFeed = useFeedStore((s) => s.fetchFeed);

  const [post, setPost] = useState<FeedPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    const fromStore = feedPosts.find((p) => p.id === postId);
    if (fromStore) {
      setPost(fromStore);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch<SinglePostResponse>(`/posts/${postId}`)
      .then((res) => setPost(res.data))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [postId, feedPosts]);

  useEffect(() => {
    if (feedPosts.length === 0) {
      fetchFeed();
    }
  }, [feedPosts.length, fetchFeed]);

  const morePosts = feedPosts.filter((p) => p.id !== postId);

  const handleOpenComments = (id: string) => {
    setCommentPostId(id);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <span className={styles.headerTitle}>Publication</span>
        </header>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <span className={styles.headerTitle}>Publication</span>
        </header>
        <div className={styles.notFound}>Post not found</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <span className={styles.headerTitle}>Publication</span>
      </header>

      <div className={styles.postWrapper}>
        <FeedPost
          post={post}
          onOpenComments={handleOpenComments}
        />
      </div>

      {morePosts.length > 0 && (
        <>
          <div className={styles.divider} />
          <div className={styles.moreSection}>
            <p className={styles.moreTitle}>More posts</p>
            <ExploreGrid posts={morePosts} />
          </div>
        </>
      )}

      {isMobile && commentPostId && (
        <CommentSheet
          postId={commentPostId}
          onClose={() => setCommentPostId(null)}
        />
      )}
    </div>
  );
}
