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

  const user = useAuthStore((state) => state.user);
  const incrementCommentCount = useFeedStore((state) => state.incrementCommentCount);
  const decrementCommentCount = useFeedStore((state) => state.decrementCommentCount);

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
      const response = await apiFetch<CreateCommentResponse>(
        `/posts/${postId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ text: newCommentText.trim() }),
        }
      );
      setComments((prev) => [response.data, ...prev]);
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
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      decrementCommentCount(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  const canDeleteComment = (comment: PostComment): boolean => {
    return !!user && comment.userId === user.id;
  };

  return {
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
  };
}
