import { create } from "zustand";
import type { FeedPost } from "@rearden/types";
import { apiFetch } from "@/lib/api";

interface ProfilePostsState {
  posts: FeedPost[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  cursor: string | null;
  error: string | null;
  currentUserId: string | null;
  fetchPosts: (userId: string) => Promise<void>;
  loadMore: (userId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  toggleBookmark: (postId: string) => Promise<void>;
  incrementCommentCount: (postId: string) => void;
  decrementCommentCount: (postId: string) => void;
  reset: () => void;
}

interface FeedResponse {
  success: boolean;
  data: FeedPost[];
  meta?: {
    nextCursor?: string | null;
  };
}

interface LikeResponse {
  success: boolean;
  data: {
    liked: boolean;
    likeCount: number;
  };
}

interface BookmarkResponse {
  success: boolean;
  data: {
    bookmarked: boolean;
  };
}

export const useProfilePostsStore = create<ProfilePostsState>((set, get) => ({
  posts: [],
  loading: false,
  loadingMore: false,
  hasMore: true,
  cursor: null,
  error: null,
  currentUserId: null,

  fetchPosts: async (userId: string) => {
    const { currentUserId } = get();
    if (currentUserId === userId && get().posts.length > 0) return;

    set({ loading: true, error: null, currentUserId: userId });
    try {
      const response = await apiFetch<FeedResponse>(
        `/feed?userId=${userId}&limit=20`
      );
      set({
        posts: response.data,
        cursor: response.meta?.nextCursor || null,
        hasMore: !!response.meta?.nextCursor,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load posts",
        loading: false,
      });
    }
  },

  loadMore: async (userId: string) => {
    const { cursor, loadingMore, hasMore } = get();
    if (loadingMore || !hasMore || !cursor) return;

    set({ loadingMore: true, error: null });
    try {
      const response = await apiFetch<FeedResponse>(
        `/feed?userId=${userId}&cursor=${cursor}&limit=20`
      );
      set((state) => ({
        posts: [...state.posts, ...response.data],
        cursor: response.meta?.nextCursor || null,
        hasMore: !!response.meta?.nextCursor,
        loadingMore: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load more posts",
        loadingMore: false,
      });
    }
  },

  toggleLike: async (postId: string) => {
    const { posts } = get();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const previousIsLiked = post.isLiked;
    const previousLikeCount = post.likeCount;

    set({
      posts: posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      ),
    });

    try {
      const response = await apiFetch<LikeResponse>(`/posts/${postId}/like`, {
        method: "POST",
      });

      set({
        posts: get().posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: response.data.liked,
                likeCount: response.data.likeCount,
              }
            : p
        ),
      });
    } catch {
      set({
        posts: get().posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: previousIsLiked,
                likeCount: previousLikeCount,
              }
            : p
        ),
      });
    }
  },

  toggleBookmark: async (postId: string) => {
    const { posts } = get();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const previousIsBookmarked = post.isBookmarked;

    set({
      posts: posts.map((p) =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      ),
    });

    try {
      const response = await apiFetch<BookmarkResponse>(
        `/posts/${postId}/bookmark`,
        { method: "POST" }
      );

      set({
        posts: get().posts.map((p) =>
          p.id === postId
            ? { ...p, isBookmarked: response.data.bookmarked }
            : p
        ),
      });
    } catch {
      set({
        posts: get().posts.map((p) =>
          p.id === postId
            ? { ...p, isBookmarked: previousIsBookmarked }
            : p
        ),
      });
    }
  },

  incrementCommentCount: (postId: string) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      ),
    }));
  },

  decrementCommentCount: (postId: string) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, commentCount: Math.max(0, p.commentCount - 1) }
          : p
      ),
    }));
  },

  reset: () => {
    set({
      posts: [],
      loading: false,
      loadingMore: false,
      hasMore: true,
      cursor: null,
      error: null,
      currentUserId: null,
    });
  },
}));
