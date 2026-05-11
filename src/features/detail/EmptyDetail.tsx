import { useMemo } from 'react';
import { useItemsStore } from '../../store/itemsStore';

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['j', 'k'], label: 'Navigate up / down' },
  { keys: ['Enter'], label: 'Open first message' },
  { keys: ['e'], label: 'Mark as Done' },
  { keys: ['1', '2', '3'], label: 'Set priority P1 / P2 / P3' },
  { keys: ['[', ']'], label: 'Cycle status backward / forward' },
  { keys: ['x'], label: 'Toggle bulk-select' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['Esc'], label: 'Clear search · close detail' },
];

export function EmptyDetail() {
  const items = useItemsStore((s) => s.items);

  const stats = useMemo(() => {
    let unread = 0;
    let p1 = 0;
    let inProgress = 0;
    for (const i of items) {
      if (i.status === 'New') unread += 1;
      if (i.status === 'In Progress') inProgress += 1;
      if (i.priority === 'P1') p1 += 1;
    }
    return { total: items.length, unread, p1, inProgress };
  }, [items]);

  return (
    <div className="min-h-full grid place-items-center py-12 px-6">
      <div className="w-full max-w-xl space-y-10 text-center">
        <header className="space-y-3">
          <KoalaHero />
          <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">
            Welcome to your Triage Inbox
          </h1>
          <p className="text-sm text-ink-500 max-w-sm mx-auto">
            Pick a message on the left to read it, edit it, or hand it to the AI.
            Built for fast keyboard-driven triage — no mouse required.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="In inbox" value={stats.total} />
          <Stat label="New" value={stats.unread} accent="text-status-new" />
          <Stat label="P1" value={stats.p1} accent="text-priority-p1" />
        </div>

        <section className="text-left">
          <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">
            Keyboard shortcuts
          </div>
          <ul className="space-y-2">
            {SHORTCUTS.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 shrink-0 min-w-[88px]">
                  {s.keys.map((k) => (
                    <kbd key={k} className="kbd">
                      {k}
                    </kbd>
                  ))}
                </span>
                <span className="text-ink-700">{s.label}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: Readonly<{ label: string; value: number; accent?: string }>) {
  return (
    <div className="rounded-xl bg-white border border-ink-200 shadow-card px-4 py-4">
      <div className={`text-2xl font-semibold tabular-nums ${accent ?? 'text-ink-900'}`}>
        {value}
      </div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
    </div>
  );
}

function KoalaHero() {
  return (
    <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500 grid place-items-center shadow-pop">
      <svg width="36" height="36" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="22" cy="26" r="8" fill="#fff" />
        <circle cx="42" cy="26" r="8" fill="#fff" />
        <circle cx="22" cy="26" r="3.5" fill="#1A0937" />
        <circle cx="42" cy="26" r="3.5" fill="#1A0937" />
        <ellipse cx="32" cy="42" rx="11" ry="9" fill="#fff" />
        <ellipse cx="32" cy="40" rx="3" ry="2.2" fill="#1A0937" />
        <path d="M28 46 q4 3 8 0" stroke="#1A0937" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
