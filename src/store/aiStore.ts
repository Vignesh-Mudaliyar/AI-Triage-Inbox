import { create } from 'zustand';
import type { AIHeader } from '../features/ai/mockAI';

export type AIStatus = 'idle' | 'streaming' | 'success' | 'error' | 'cancelled';

export type AIErrorKind = 'network' | 'invalid';

export interface AIError {
  kind: AIErrorKind;
  message: string;
  issues?: string[];
  raw?: string;
}

export interface AIItemState {
  status: AIStatus;
  header?: AIHeader;
  /** The original AI-produced draft. Frozen once streaming completes. */
  aiDraft: string;
  /** What the user sees and edits. Diverges from aiDraft once they type. */
  userDraft: string;
  userDraftDirty: boolean;
  /** Raw JSON serialization of the most recent AI output (for debug). */
  raw?: string;
  error?: AIError;
}

const DEFAULT: AIItemState = {
  status: 'idle',
  aiDraft: '',
  userDraft: '',
  userDraftDirty: false,
};

interface AIStoreState {
  byId: Record<string, AIItemState>;
  get: (id: string) => AIItemState;
  patch: (id: string, patch: Partial<AIItemState>) => void;
  setUserDraft: (id: string, value: string) => void;
  resetUserDraft: (id: string) => void;
  reset: (id: string) => void;
}

export const useAIStore = create<AIStoreState>((set, get) => ({
  byId: {},
  get: (id) => get().byId[id] ?? DEFAULT,
  patch: (id, patch) =>
    set((s) => ({
      byId: { ...s.byId, [id]: { ...(s.byId[id] ?? DEFAULT), ...patch } },
    })),
  setUserDraft: (id, value) =>
    set((s) => {
      const cur = s.byId[id] ?? DEFAULT;
      return {
        byId: {
          ...s.byId,
          [id]: { ...cur, userDraft: value, userDraftDirty: value !== cur.aiDraft },
        },
      };
    }),
  resetUserDraft: (id) =>
    set((s) => {
      const cur = s.byId[id] ?? DEFAULT;
      return {
        byId: {
          ...s.byId,
          [id]: { ...cur, userDraft: cur.aiDraft, userDraftDirty: false },
        },
      };
    }),
  reset: (id) =>
    set((s) => {
      const next = { ...s.byId };
      delete next[id];
      return { byId: next };
    }),
}));
