import { create } from "zustand";

interface HeaderStore {
  title: string | null;
  setTitle: (title: string | null) => void;
}

export const useHeaderStore = create<HeaderStore>((set) => ({
  title: null,
  setTitle: (title) => set({ title }),
}));
