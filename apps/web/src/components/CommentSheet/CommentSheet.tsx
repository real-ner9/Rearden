import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "@phosphor-icons/react";
import { CommentItem } from "@/components/CommentItem/CommentItem";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { useComments } from "@/hooks/useComments";
import { useBottomSheet } from "@/hooks/useBottomSheet";
import styles from "./CommentSheet.module.scss";

interface CommentSheetProps {
  postId: string;
  onClose: () => void;
}

export function CommentSheet({ postId, onClose }: CommentSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { sheetDragProps, backdropOpacity, startDrag } = useBottomSheet({ onClose });

  const {
    comments,
    loading,
    loadingMore,
    hasMore,
    error,
    newCommentText,
    submitting,
    replyToId,
    replyToComment,
    setNewCommentText,
    setReplyToId,
    loadMore,
    submitComment,
    deleteComment,
    canDeleteComment,
    toggleCommentLike,
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

  const handleDeleteClick = (commentId: string) => {
    setConfirmDeleteId(commentId);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      deleteComment(confirmDeleteId);
      setConfirmDeleteId(null);
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
        style={{ opacity: backdropOpacity }}
      />
      <motion.div
        className={styles.sheet}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        {...sheetDragProps}
      >
        <div className={styles.handleArea} onPointerDown={startDrag}>
          <div className={styles.handle} />
        </div>

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
                  <div key={comment.id}>
                    <CommentItem
                      comment={comment}
                      onDelete={canDeleteComment(comment) ? handleDeleteClick : undefined}
                      onReply={setReplyToId}
                      onLike={toggleCommentLike}
                    />
                    {comment.replies?.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        onDelete={canDeleteComment(reply) ? handleDeleteClick : undefined}
                        onLike={toggleCommentLike}
                        isReply
                      />
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {replyToId && replyToComment && (
          <div className={styles.replyIndicator}>
            <span>
              Replying to <strong>@{replyToComment.author.username || replyToComment.author.name || "user"}</strong>
            </span>
            <button className={styles.cancelReply} onClick={() => setReplyToId(null)} aria-label="Cancel reply">
              <X size={16} weight="bold" />
            </button>
          </div>
        )}

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

      <AnimatePresence>
        {confirmDeleteId && (
          <ConfirmDialog
            title="Delete comment?"
            message="This can't be undone."
            confirmLabel="Delete"
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirmDeleteId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
