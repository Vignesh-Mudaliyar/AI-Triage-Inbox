import { create } from 'zustand';
import type { InboxItem, Priority, Status } from '../types';
import { MOCK_ITEMS } from '../data/mockItems';

interface ItemsState {
  items: InboxItem[];
  setStatus: (id: string, status: Status) => void;
  setPriority: (id: string, priority: Priority) => void;
  setNotes: (id: string, notes: string) => void;
  bulkSetStatus: (ids: string[], status: Status) => void;
}

export const useItemsStore = create<ItemsState>((set) => ({
  items: MOCK_ITEMS,
  setStatus: (id, status) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, status } : i)),
    })),
  setPriority: (id, priority) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, priority } : i)),
    })),
  setNotes: (id, notes) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, notes } : i)),
    })),
  bulkSetStatus: (ids, status) => {
    const set$ = new Set(ids);
    set((s) => ({
      items: s.items.map((i) => (set$.has(i.id) ? { ...i, status } : i)),
    }));
  },
}));
