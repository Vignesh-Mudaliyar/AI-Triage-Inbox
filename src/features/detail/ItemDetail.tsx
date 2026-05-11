import { lazy, Suspense, useMemo } from "react";
import { useItemsStore } from "../../store/itemsStore";
import { useUIStore } from "../../store/uiStore";
import { formatAbsolute } from "../../shared/utils/time";
import { StatusPriorityControls } from "./StatusPriorityControls";
import { NotesField } from "./NotesField";
import { EmptyDetail } from "./EmptyDetail";
import { Button } from "../../shared/ui/Button";

// Code-split the AI feature — Zod, mock AI, debug panel, and the modal all
// live behind this lazy boundary so they're absent from the initial bundle.
const AIAssistPanel = lazy(() =>
  import("../ai/AIAssistPanel").then((m) => ({ default: m.AIAssistPanel })),
);

export function ItemDetail() {
  const selectedId = useUIStore((s) => s.selectedId);
  const selectId = useUIStore((s) => s.selectId);
  const items = useItemsStore((s) => s.items);

  const item = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  if (!item) return <EmptyDetail />;

  return (
    <article className="max-w-3xl mx-auto px-5 lg:px-8 py-6 space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-ink-900 tracking-tight leading-snug">
            {item.subject}
          </h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => selectId(null)}
            className="lg:hidden"
            aria-label="Close detail"
          >
            ✕
          </Button>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Avatar name={item?.sender?.name} />
          <div className="min-w-0">
            <div className="font-medium text-ink-900 truncate">
              {item.sender.name}
            </div>
            <div className="text-ink-500 text-xs truncate">
              {item.sender.email} · {item.channel} ·{" "}
              {formatAbsolute(item.received_at)}
            </div>
          </div>
        </div>

        <StatusPriorityControls item={item} />
      </header>

      <section
        aria-label="Message body"
        className="rounded-xl bg-white border border-ink-200 shadow-card"
      >
        <pre className="font-sans text-[15px] leading-relaxed text-ink-900 whitespace-pre-wrap break-words p-5">
          {item.body}
        </pre>
        {item.tags.length > 0 && (
          <div className="px-5 pb-4 -mt-1 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] text-ink-500 bg-ink-100 rounded px-1.5 py-0.5"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </section>

      <NotesField id={item.id} initial={item.notes ?? ""} />

      <Suspense fallback={<AIPanelSkeleton />}>
        <AIAssistPanel item={item} />
      </Suspense>
    </article>
  );
}

function AIPanelSkeleton() {
  return (
    <div className="rounded-xl bg-white border border-ink-200 shadow-card p-5 h-32 animate-pulse-soft" />
  );
}

function Avatar({ name }: Readonly<{ name: string }>) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden="true"
      className="w-9 h-9 shrink-0 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-sm font-semibold"
    >
      {initials || "?"}
    </div>
  );
}
