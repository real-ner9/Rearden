import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { useNotificationStore } from "./notificationStore";

interface FollowState {
  followingMap: Record<string, boolean>;
  loadingMap: Record<string, boolean>;
  setFollowing: (userId: string, isFollowing: boolean) => void;
  isFollowing: (userId: string) => boolean;
  isLoading: (userId: string) => boolean;
  toggleFollow: (targetUserId: string, targetName: string) => Promise<void>;
}

export const useFollowStore = create<FollowState>((set, get) => ({
  followingMap: {},
  loadingMap: {},

  setFollowing: (userId, isFollowing) =>
    set((s) => ({ followingMap: { ...s.followingMap, [userId]: isFollowing } })),

  isFollowing: (userId) => get().followingMap[userId] ?? false,

  isLoading: (userId) => get().loadingMap[userId] ?? false,

  toggleFollow: async (targetUserId, targetName) => {
    const { followingMap, loadingMap } = get();
    if (loadingMap[targetUserId]) return;

    const wasFollowing = followingMap[targetUserId] ?? false;

    // Optimistic update
    set((s) => ({
      followingMap: { ...s.followingMap, [targetUserId]: !wasFollowing },
      loadingMap: { ...s.loadingMap, [targetUserId]: true },
    }));

    try {
      await apiFetch(`/users/${targetUserId}/follow`, { method: "POST" });

      if (!wasFollowing) {
        useNotificationStore.getState().addNotification({
          id: `follow-${targetUserId}-${Date.now()}`,
          type: "new_follow",
          message: `You followed @${targetName}`,
          timestamp: new Date(),
          read: false,
        });
      }
    } catch {
      // Rollback on error
      set((s) => ({
        followingMap: { ...s.followingMap, [targetUserId]: wasFollowing },
      }));
    } finally {
      set((s) => ({
        loadingMap: { ...s.loadingMap, [targetUserId]: false },
      }));
    }
  },
}));
