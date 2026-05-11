import { useEffect, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useFilteredItems } from './useFilteredItems';
import { useInboxKeyboardNav } from './useInboxKeyboardNav';
import { FilterBar } from './FilterBar';
import { InboxRow } from './InboxRow';
import { BulkBar } from './BulkBar';
import { EmptyInbox } from './EmptyInbox';

export function InboxList() {
  const filtered = useFilteredItems();
  const selectedId = useUIStore((s) => s.selectedId);
  const selectId = useUIStore((s) => s.selectId);
  const bulkMode = useUIStore((s) => s.bulkMode);
  const selectedIds = useUIStore((s) => s.selectedIds);
  const toggleSelected = useUIStore((s) => s.toggleSelected);

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useInboxKeyboardNav(filtered, searchRef);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    row?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <FilterBar ref={searchRef} />
      <BulkBar />

      {filtered.length === 0 ? (
        <EmptyInbox />
      ) : (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Messages"
          className="flex-1 min-h-0 overflow-y-auto divide-y divide-ink-100"
        >
          {filtered.map((item) => (
            <div key={item.id} data-id={item.id}>
              <InboxRow
                item={item}
                selected={item.id === selectedId}
                active={item.id === selectedId}
                bulkMode={bulkMode}
                checked={selectedIds.has(item.id)}
                onClick={() => (bulkMode ? toggleSelected(item.id) : selectId(item.id))}
                onToggle={() => toggleSelected(item.id)}
              />
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}
