import { useUIStore } from '../store/uiStore';

export function Header() {
  const debug = useUIStore((s) => s.debugMode);
  const setDebug = useUIStore((s) => s.setDebugMode);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-ink-200">
      <div className="h-14 px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-lg bg-brand-500 grid place-items-center shadow-card"
          >
            <KoalaMark />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold tracking-tight text-ink-900">Triage Inbox</span>
            <span className="text-xs text-ink-500 hidden sm:inline">by Qoala</span>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-ink-500 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={debug}
            onChange={(e) => setDebug(e.target.checked)}
            className="accent-brand-500"
          />
          Debug mode
        </label>
      </div>
    </header>
  );
}

function KoalaMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="22" cy="26" r="8" fill="#fff" />
      <circle cx="42" cy="26" r="8" fill="#fff" />
      <circle cx="22" cy="26" r="3.5" fill="#1A0937" />
      <circle cx="42" cy="26" r="3.5" fill="#1A0937" />
      <ellipse cx="32" cy="42" rx="11" ry="9" fill="#fff" />
      <ellipse cx="32" cy="40" rx="3" ry="2.2" fill="#1A0937" />
    </svg>
  );
}
