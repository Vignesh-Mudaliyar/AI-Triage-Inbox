import { create } from 'zustand';
import type { Priority, Status } from '../types';

export type StatusFilter = Status | 'All';
export type PriorityFilter = Priority | 'All';

interface UIState {
  selectedId: string | null;
  selectId: (id: string | null) => void;

  query: string;
  setQuery: (q: string) => void;

  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  setStatusFilter: (s: StatusFilter) => void;
  setPriorityFilter: (p: PriorityFilter) => void;

  bulkMode: boolean;
  setBulkMode: (on: boolean) => void;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;

  debugMode: boolean;
  setDebugMode: (on: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedId: null,
  selectId: (id) => set({ selectedId: id }),

  query: '',
  setQuery: (q) => set({ query: q }),

  statusFilter: 'All',
  priorityFilter: 'All',
  setStatusFilter: (s) => set({ statusFilter: s }),
  setPriorityFilter: (p) => set({ priorityFilter: p }),

  bulkMode: false,
  setBulkMode: (on) => set({ bulkMode: on, selectedIds: on ? new Set() : new Set() }),
  selectedIds: new Set(),
  toggleSelected: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedIds: next };
    }),
  clearSelected: () => set({ selectedIds: new Set() }),

  debugMode: false,
  setDebugMode: (on) => set({ debugMode: on }),
}));
