import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@rearden/types";
import { useEffect } from "react";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  validateToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: !!localStorage.getItem("rearden_token"),

      login: (token: string, user: User) => {
        set({ token, user });
      },

      logout: () => {
        set({ token: null, user: null });
      },

      updateUser: (user: User) => {
        set({ user });
      },

      validateToken: () => {
        const { token, logout } = get();

        if (!token) {
          set({ loading: false });
          return;
        }

        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Invalid token");
            return res.json();
          })
          .then((data) => {
            if (data.success) {
              set({ user: data.data });
            } else {
              logout();
            }
          })
          .catch(() => {
            logout();
          })
          .finally(() => {
            set({ loading: false });
          });
      },
    }),
    {
      name: "rearden_token",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
    }
  )
);

/**
 * Hook to initialize auth state on mount
 * Call this once from an initializer component
 */
export function useAuthInit() {
  const validateToken = useAuthStore((s) => s.validateToken);

  useEffect(() => {
    validateToken();
  }, [validateToken]);
}
