import { useState, useEffect } from "react";
import type { PostComment } from "@rearden/types";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useFeedStore } from "@/stores/feedStore";

interface CommentsResponse {
  success: boolean;
  data: PostComment[];
  meta?: {
    nextCursor?: string | null;
  };
}

interface CreateCommentResponse {
  success: boolean;
  data: PostComment;
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const incrementCommentCount = useFeedStore((state) => state.incrementCommentCount);
  const decrementCommentCount = useFeedStore((state) => state.decrementCommentCount);

  // Find the comment being replied to
  const replyToComment = replyToId
    ? comments.find((c) => c.id === replyToId) ||
      comments.find((c) => c.replies?.some((r) => r.id === replyToId))?.replies?.find((r) => r.id === replyToId)
    : null;

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<CommentsResponse>(
        `/posts/${postId}/comments?limit=30`
      );
      setComments(response.data);
      setCursor(response.meta?.nextCursor || null);
      setHasMore(!!response.meta?.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || !cursor) return;

    setLoadingMore(true);
    setError(null);
    try {
      const response = await apiFetch<CommentsResponse>(
        `/posts/${postId}/comments?cursor=${cursor}&limit=30`
      );
      setComments((prev) => [...prev, ...response.data]);
      setCursor(response.meta?.nextCursor || null);
      setHasMore(!!response.meta?.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more comments");
    } finally {
      setLoadingMore(false);
    }
  };

  const submitComment = async () => {
    if (!newCommentText.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const body = replyToId
        ? { text: newCommentText.trim(), parentId: replyToId }
        : { text: newCommentText.trim() };

      const response = await apiFetch<CreateCommentResponse>(
        `/posts/${postId}/comments`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      if (replyToId) {
        // Insert into parent's replies array
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyToId
              ? { ...c, replies: [...(c.replies || []), response.data], replyCount: (c.replyCount || 0) + 1 }
              : c
          )
        );
        setReplyToId(null);
      } else {
        // Prepend to top-level comments
        setComments((prev) => [response.data, ...prev]);
      }

      setNewCommentText("");
      incrementCommentCount(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await apiFetch(`/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });

      // Check if it's a reply or top-level comment
      let isReply = false;
      let replyCountToDecrement = 1;

      for (const comment of comments) {
        if (comment.replies?.some((r) => r.id === commentId)) {
          isReply = true;
          break;
        }
        if (comment.id === commentId) {
          replyCountToDecrement = 1 + (comment.replyCount || 0);
          break;
        }
      }

      if (isReply) {
        // Remove from parent's replies array
        setComments((prev) =>
          prev.map((c) =>
            c.replies?.some((r) => r.id === commentId)
              ? { ...c, replies: c.replies.filter((r) => r.id !== commentId), replyCount: (c.replyCount || 0) - 1 }
              : c
          )
        );
      } else {
        // Remove from top-level comments
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }

      decrementCommentCount(postId, replyCountToDecrement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  const canDeleteComment = (comment: PostComment): boolean => {
    return !!user && comment.userId === user.id;
  };

  const toggleCommentLike = async (commentId: string) => {
    // Optimistic update
    const updateLike = (c: PostComment): PostComment => {
      if (c.id === commentId) {
        const newIsLiked = !c.isLiked;
        return {
          ...c,
          isLiked: newIsLiked,
          likeCount: (c.likeCount || 0) + (newIsLiked ? 1 : -1),
        };
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(updateLike) };
      }
      return c;
    };

    setComments((prev) => prev.map(updateLike));

    try {
      await apiFetch(`/posts/${postId}/comments/${commentId}/like`, {
        method: "POST",
      });
    } catch {
      // Revert on error
      const revertLike = (c: PostComment): PostComment => {
        if (c.id === commentId) {
          const revertIsLiked = !c.isLiked;
          return {
            ...c,
            isLiked: revertIsLiked,
            likeCount: (c.likeCount || 0) + (revertIsLiked ? 1 : -1),
          };
        }
        if (c.replies) {
          return { ...c, replies: c.replies.map(revertLike) };
        }
        return c;
      };
      setComments((prev) => prev.map(revertLike));
    }
  };

  return {
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
  };
}
