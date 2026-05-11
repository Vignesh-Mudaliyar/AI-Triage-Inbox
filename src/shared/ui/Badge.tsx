import type { Priority, Status } from '../../types';
import { cx } from '../utils/cx';

const STATUS_STYLES: Record<Status, string> = {
  New: 'bg-blue-50 text-status-new ring-1 ring-inset ring-blue-200',
  'In Progress': 'bg-amber-50 text-status-progress ring-1 ring-inset ring-amber-200',
  Done: 'bg-emerald-50 text-status-done ring-1 ring-inset ring-emerald-200',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  P1: 'bg-red-50 text-priority-p1 ring-1 ring-inset ring-red-200',
  P2: 'bg-amber-50 text-priority-p2 ring-1 ring-inset ring-amber-200',
  P3: 'bg-ink-100 text-priority-p3 ring-1 ring-inset ring-ink-200',
};

export function StatusBadge({ value }: Readonly<{ value: Status }>) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide',
        STATUS_STYLES[value]
      )}
    >
      {value}
    </span>
  );
}

export function PriorityBadge({ value }: Readonly<{ value: Priority }>) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
        PRIORITY_STYLES[value]
      )}
    >
      {value}
    </span>
  );
}
