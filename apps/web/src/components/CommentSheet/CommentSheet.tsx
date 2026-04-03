import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { CommentItem } from "@/components/CommentItem/CommentItem";
import { useComments } from "@/hooks/useComments";
import styles from "./CommentSheet.module.scss";

interface CommentSheetProps {
  postId: string;
  onClose: () => void;
}

export function CommentSheet({ postId, onClose }: CommentSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
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
  } = useComments(postId);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || loadingMore || !hasMore) return;

      const { scrollTop } = scrollRef.current;
      if (scrollTop < 100) {
        loadMore();
      }
    };

    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener("scroll", handleScroll);
    return () => scrollElement?.removeEventListener("scroll", handleScroll);
  }, [loadMore, loadingMore, hasMore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitComment();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.sheet}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
      >
        <div className={styles.handle} />

        <header className={styles.header}>
          <h2 className={styles.title}>Comments</h2>
        </header>

        <div className={styles.content} ref={scrollRef}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : comments.length === 0 ? (
            <div className={styles.empty}>No comments yet</div>
          ) : (
            <>
              {loadingMore && (
                <div className={styles.loadingMore}>
                  <div className={styles.spinner} />
                </div>
              )}
              <div className={styles.commentList}>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onDelete={canDeleteComment(comment) ? deleteComment : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <form className={styles.inputWrapper} onSubmit={handleSubmit}>
          <textarea
            className={styles.input}
            placeholder="Add a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={submitting}
          />
          <button
            type="submit"
            className={styles.postButton}
            disabled={!newCommentText.trim() || submitting}
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      </motion.div>
    </>
  );
}
