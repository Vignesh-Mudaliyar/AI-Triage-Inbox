import type { InboxItem, Priority, Status } from '../../types';
import { useItemsStore } from '../../store/itemsStore';
import { cx } from '../../shared/utils/cx';

const STATUSES: Status[] = ['New', 'In Progress', 'Done'];
const PRIORITIES: Priority[] = ['P1', 'P2', 'P3'];

export function StatusPriorityControls({ item }: { item: InboxItem }) {
  const setStatus = useItemsStore((s) => s.setStatus);
  const setPriority = useItemsStore((s) => s.setPriority);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <Group label="Status">
        {STATUSES.map((s) => (
          <Segment
            key={s}
            active={item.status === s}
            onClick={() => setStatus(item.id, s)}
            tone={s === 'Done' ? 'done' : s === 'In Progress' ? 'progress' : 'new'}
          >
            {s}
          </Segment>
        ))}
      </Group>

      <Group label="Priority">
        {PRIORITIES.map((p) => (
          <Segment
            key={p}
            active={item.priority === p}
            onClick={() => setPriority(item.id, p)}
            tone={p === 'P1' ? 'p1' : p === 'P2' ? 'p2' : 'p3'}
          >
            {p}
          </Segment>
        ))}
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-500 uppercase tracking-wide">{label}</span>
      <div className="inline-flex bg-ink-100 rounded-md p-0.5">{children}</div>
    </div>
  );
}

const TONE: Record<string, string> = {
  new: 'data-[active=true]:bg-blue-50 data-[active=true]:text-status-new',
  progress: 'data-[active=true]:bg-amber-50 data-[active=true]:text-status-progress',
  done: 'data-[active=true]:bg-emerald-50 data-[active=true]:text-status-done',
  p1: 'data-[active=true]:bg-red-50 data-[active=true]:text-priority-p1',
  p2: 'data-[active=true]:bg-amber-50 data-[active=true]:text-priority-p2',
  p3: 'data-[active=true]:bg-white data-[active=true]:text-ink-900',
};

function Segment({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone: string;
}) {
  return (
    <button
      data-active={active}
      onClick={onClick}
      className={cx(
        'h-7 px-3 text-xs font-medium rounded transition-colors',
        active ? 'shadow-sm' : 'text-ink-500 hover:text-ink-700',
        TONE[tone]
      )}
    >
      {children}
    </button>
  );
}
