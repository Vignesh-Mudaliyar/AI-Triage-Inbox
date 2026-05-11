import { memo } from 'react';
import type { InboxItem } from '../../types';
import { PriorityBadge, StatusBadge } from '../../shared/ui/Badge';
import { formatRelative } from '../../shared/utils/time';
import { cx } from '../../shared/utils/cx';

interface Props {
  item: InboxItem;
  selected: boolean;
  active: boolean;
  bulkMode: boolean;
  checked: boolean;
  onClick: () => void;
  onToggle: () => void;
}

function InboxRowImpl({
  item,
  selected,
  active,
  bulkMode,
  checked,
  onClick,
  onToggle,
}: Props) {
  const unread = item.status === 'New';

  return (
    <li
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      onClick={onClick}
      className={cx(
        'group relative px-4 py-3 cursor-pointer border-l-2 transition-colors',
        'flex gap-3',
        selected
          ? 'bg-brand-50 border-l-brand-500'
          : active
            ? 'bg-ink-50 border-l-transparent'
            : 'border-l-transparent hover:bg-ink-50'
      )}
    >
      {bulkMode && (
        <input
          type="checkbox"
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onChange={onToggle}
          aria-label={`Select ${item.subject}`}
          className="mt-1 accent-brand-500"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <PriorityBadge value={item.priority} />
          <span
            className={cx(
              'truncate text-sm',
              unread ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'
            )}
          >
            {item.sender.name}
          </span>
          <span className="ml-auto shrink-0 text-[11px] text-ink-500 tabular-nums">
            {formatRelative(item.received_at)}
          </span>
        </div>

        <div
          className={cx(
            'truncate text-sm mb-1',
            unread ? 'text-ink-900' : 'text-ink-700'
          )}
        >
          {item.subject}
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge value={item.status} />
          <span className="truncate text-xs text-ink-500">{previewBody(item.body)}</span>
        </div>
      </div>
    </li>
  );
}

function previewBody(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > 80 ? flat.slice(0, 80) + '…' : flat;
}

export const InboxRow = memo(InboxRowImpl);
