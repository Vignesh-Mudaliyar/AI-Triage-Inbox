import { useEffect, type RefObject } from 'react';
import type { InboxItem, Priority, Status } from '../../types';
import { useItemsStore } from '../../store/itemsStore';
import { useUIStore } from '../../store/uiStore';

const STATUS_CYCLE: Status[] = ['New', 'In Progress', 'Done'];

/**
 * Vim-style triage keys. Active when no text input/textarea has focus, except
 * for `Escape` which always works and `/` which opens search from anywhere.
 */
export function useInboxKeyboardNav(
  filtered: InboxItem[],
  searchRef: RefObject<HTMLInputElement | null>
) {
  const setStatus = useItemsStore((s) => s.setStatus);
  const setPriority = useItemsStore((s) => s.setPriority);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ui = useUIStore.getState();
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (e.key === 'Escape') {
        if (target === searchRef.current) {
          ui.setQuery('');
          searchRef.current?.blur();
          e.preventDefault();
        } else if (ui.selectedId) {
          ui.selectId(null);
          e.preventDefault();
        }
        return;
      }

      if (e.key === '/' && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      if (inField) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const idx = filtered.findIndex((i) => i.id === ui.selectedId);
      const move = (next: number) => {
        if (filtered.length === 0) return;
        const clamped = Math.max(0, Math.min(filtered.length - 1, next));
        ui.selectId(filtered[clamped].id);
      };

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          move(idx === -1 ? 0 : idx + 1);
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          move(idx === -1 ? 0 : idx - 1);
          break;
        case 'Enter':
          if (idx === -1 && filtered.length > 0) {
            e.preventDefault();
            ui.selectId(filtered[0].id);
          }
          break;
        case 'e':
          if (ui.selectedId) {
            e.preventDefault();
            setStatus(ui.selectedId, 'Done');
          }
          break;
        case '1':
        case '2':
        case '3':
          if (ui.selectedId) {
            e.preventDefault();
            setPriority(ui.selectedId, `P${e.key}` as Priority);
          }
          break;
        case '[':
        case ']': {
          if (!ui.selectedId) break;
          const item = filtered.find((i) => i.id === ui.selectedId);
          if (!item) break;
          e.preventDefault();
          const cur = STATUS_CYCLE.indexOf(item.status);
          const dir = e.key === ']' ? 1 : -1;
          const nextStatus = STATUS_CYCLE[(cur + dir + STATUS_CYCLE.length) % STATUS_CYCLE.length];
          setStatus(ui.selectedId, nextStatus);
          break;
        }
        case 'x':
          if (!ui.bulkMode) {
            ui.setBulkMode(true);
          }
          if (ui.selectedId) {
            e.preventDefault();
            ui.toggleSelected(ui.selectedId);
          }
          break;
        default:
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, searchRef, setStatus, setPriority]);
}
