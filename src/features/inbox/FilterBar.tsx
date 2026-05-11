import { forwardRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import type { PriorityFilter, StatusFilter } from '../../store/uiStore';
import { cx } from '../../shared/utils/cx';

const STATUS_OPTIONS: StatusFilter[] = ['All', 'New', 'In Progress', 'Done'];
const PRIORITY_OPTIONS: PriorityFilter[] = ['All', 'P1', 'P2', 'P3'];

export const FilterBar = forwardRef<HTMLInputElement>(function FilterBar(_, searchRef) {
  const query = useUIStore((s) => s.query);
  const setQuery = useUIStore((s) => s.setQuery);
  const status = useUIStore((s) => s.statusFilter);
  const setStatus = useUIStore((s) => s.setStatusFilter);
  const priority = useUIStore((s) => s.priorityFilter);
  const setPriority = useUIStore((s) => s.setPriorityFilter);

  return (
    <div className="px-4 pt-4 pb-3 space-y-3 border-b border-ink-200 bg-white shrink-0">
      <div className="relative">
        <SearchIcon />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subject, sender, body, tags…"
          aria-label="Search messages"
          className="w-full h-9 pl-9 pr-16 text-sm rounded-lg bg-ink-50 border border-ink-200
                     placeholder:text-ink-500 focus:bg-white focus:border-brand-300"
        />
        <kbd className="kbd absolute right-2 top-1/2 -translate-y-1/2" aria-hidden="true">/</kbd>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Pill group="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        <span className="w-px h-4 bg-ink-200 mx-1" aria-hidden="true" />
        <Pill group="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
      </div>
    </div>
  );
});

function Pill<T extends string>({
  group,
  options,
  value,
  onChange,
}: Readonly<{
  group: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}>) {
  return (
    <div role="radiogroup" aria-label={group} className="inline-flex bg-ink-100 rounded-md p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          role="radio"
          aria-checked={value === opt}
          onClick={() => onChange(opt)}
          className={cx(
            'px-2.5 h-7 text-xs font-medium rounded transition-colors',
            value === opt
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="m14 14 4 4" />
    </svg>
  );
}
