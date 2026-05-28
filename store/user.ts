import { create } from "zustand";
import type { SessionUser } from "@/types/api";

interface UserState {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
