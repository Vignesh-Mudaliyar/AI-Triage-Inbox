import { useMemo } from 'react';
import type { InboxItem } from '../../types';
import { useItemsStore } from '../../store/itemsStore';
import { useUIStore } from '../../store/uiStore';

// Sort newest-first; that's how triagers expect to see an inbox.
export function useFilteredItems(): InboxItem[] {
  const items = useItemsStore((s) => s.items);
  const query = useUIStore((s) => s.query);
  const status = useUIStore((s) => s.statusFilter);
  const priority = useUIStore((s) => s.priorityFilter);

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (status === 'All' ? true : i.status === status))
      .filter((i) => (priority === 'All' ? true : i.priority === priority))
      .filter((i) => {
        if (!q) return true;
        return (
          i.subject.toLowerCase().includes(q) ||
          i.sender.name.toLowerCase().includes(q) ||
          i.sender.email.toLowerCase().includes(q) ||
          i.body.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice()
      .sort((a, b) => +new Date(b.received_at) - +new Date(a.received_at));
  }, [items, query, status, priority]);
}
