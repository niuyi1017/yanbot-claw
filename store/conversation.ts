import { create } from "zustand";
import type { ConversationMeta } from "@/types/api";

interface ConversationState {
  current: ConversationMeta | null;
  list: ConversationMeta[];
  setCurrent: (c: ConversationMeta | null) => void;
  setList: (l: ConversationMeta[]) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  current: null,
  list: [],
  setCurrent: (current) => set({ current }),
  setList: (list) => set({ list }),
}));
