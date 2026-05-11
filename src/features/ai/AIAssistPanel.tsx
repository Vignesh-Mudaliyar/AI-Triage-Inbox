import { useState } from 'react';
import type { InboxItem } from '../../types';
import { useAIStore } from '../../store/aiStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../shared/ui/Button';
import { useAIGeneration } from './useAIGeneration';
import { RegenerateConfirm, type RegenerateChoice } from './RegenerateConfirm';
import { DebugPanel } from './DebugPanel';
import { cx } from '../../shared/utils/cx';

export function AIAssistPanel({ item }: Readonly<{ item: InboxItem }>) {
  const { cacheKey, state, isInFlight, generate, stop } = useAIGeneration(item);
  const setUserDraft = useAIStore((s) => s.setUserDraft);
  const debug = useUIStore((s) => s.debugMode);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestGenerate = () => {
    if (state.userDraftDirty && state.userDraft.trim()) {
      setConfirmOpen(true);
    } else {
      void generate('fresh');
    }
  };

  const handleConfirm = (choice: RegenerateChoice) => {
    setConfirmOpen(false);
    if (choice === 'replace') void generate('fresh');
    else if (choice === 'append') void generate('append');
  };

  return (
    <>
      <section
        aria-label="AI assist"
        className="rounded-xl bg-white border border-ink-200 shadow-card overflow-hidden"
      >
        <PanelHeader
          status={state.status}
          confidence={state.header?.confidence}
          inFlight={isInFlight}
          hasResult={Boolean(state.header)}
          onGenerate={requestGenerate}
          onStop={stop}
        />

        <div className="p-5 space-y-5">
          {state.status === 'idle' && <IdleState onGenerate={requestGenerate} />}

          {state.status === 'error' && state.error && (
            <ErrorState
              kind={state.error.kind}
              message={state.error.message}
              onRetry={() => generate('fresh')}
            />
          )}

          {state.header && (
            <HeaderSummary
              category={state.header.category}
              priority={state.header.priority}
              confidence={state.header.confidence}
              bullets={state.header.summary_bullets}
              suggestedAction={state.header.suggested_action}
            />
          )}

          {(state.header || state.aiDraft || state.userDraft) && (
            <DraftEditor
              itemId={item.id}
              value={state.userDraft}
              isStreaming={isInFlight}
              dirty={state.userDraftDirty}
              status={state.status}
              onChange={(v) => setUserDraft(cacheKey, v)}
              onStop={stop}
              onRegenerate={requestGenerate}
            />
          )}
        </div>
      </section>

      {debug && (
        <div className="mt-4">
          <DebugPanel cacheKey={cacheKey} onRetry={() => generate('fresh')} />
        </div>
      )}

      <RegenerateConfirm open={confirmOpen} onChoose={handleConfirm} />
    </>
  );
}

// ---------- Sub-views ----------

function PanelHeader({
  status,
  confidence,
  inFlight,
  hasResult,
  onGenerate,
  onStop,
}: Readonly<{
  status: string;
  confidence?: number;
  inFlight: boolean;
  hasResult: boolean;
  onGenerate: () => void;
  onStop: () => void;
}>) {
  return (
    <div className="px-5 py-3 border-b border-ink-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <SparkleIcon />
        <span className="text-sm font-semibold text-ink-900">AI assist</span>
        {inFlight && (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-brand-600"
            aria-live="polite"
          >
            <Spinner /> generating…
          </span>
        )}
        {!inFlight && status === 'cancelled' && (
          <span className="text-xs text-ink-500">stopped</span>
        )}
        {!inFlight && confidence !== undefined && (
          <span className="text-xs text-ink-500">
            confidence {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {inFlight ? (
          <Button size="sm" variant="secondary" onClick={onStop}>
            Stop
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={onGenerate}>
            {status === 'cancelled' ? 'Retry' : hasResult ? 'Regenerate' : 'Generate'}
          </Button>
        )}
      </div>
    </div>
  );
}

function IdleState({ onGenerate }: Readonly<{ onGenerate: () => void }>) {
  return (
    <div className="text-center py-6 space-y-3">
      <div className="text-3xl" aria-hidden="true">✨</div>
      <div>
        <div className="text-sm font-medium text-ink-900">No suggestions yet</div>
        <div className="text-xs text-ink-500">
          Generate a summary, category and a draft reply you can edit.
        </div>
      </div>
      <Button size="sm" variant="primary" onClick={onGenerate}>
        Generate AI suggestions
      </Button>
    </div>
  );
}

function ErrorState({
  kind,
  message,
  onRetry,
}: Readonly<{
  kind: 'network' | 'invalid';
  message: string;
  onRetry: () => void;
}>) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3"
    >
      <div className="text-red-600 mt-0.5" aria-hidden="true">⚠</div>
      <div className="flex-1 space-y-1">
        <div className="text-sm font-semibold text-red-900">
          {kind === 'network' ? 'Could not reach the AI provider' : 'AI returned an unexpected response'}
        </div>
        <div className="text-xs text-red-800">{message}</div>
        {kind === 'invalid' && (
          <div className="text-xs text-red-700">
            We caught the bad output before showing it. Open <strong>Debug mode</strong> to inspect the raw payload.
          </div>
        )}
        <div className="pt-1">
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

function HeaderSummary({
  category,
  priority,
  confidence,
  bullets,
  suggestedAction,
}: Readonly<{
  category: string;
  priority: string;
  confidence: number;
  bullets: string[];
  suggestedAction: string;
}>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-2">
        <Tag>{category}</Tag>
        <Tag>{priority}</Tag>
        <Tag muted>{Math.round(confidence * 100)}%</Tag>
      </div>

      <div>
        <SectionLabel>Summary</SectionLabel>
        <ul className="space-y-1 text-sm text-ink-700">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-brand-500 mt-1.5 w-1 h-1 rounded-full bg-brand-500 shrink-0" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <SectionLabel>Suggested next action</SectionLabel>
        <p className="text-sm text-ink-700">{suggestedAction}</p>
      </div>
    </div>
  );
}

function DraftEditor({
  itemId,
  value,
  isStreaming,
  dirty,
  status,
  onChange,
  onStop,
  onRegenerate,
}: Readonly<{
  itemId: string;
  value: string;
  isStreaming: boolean;
  dirty: boolean;
  status: string;
  onChange: (v: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
}>) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={`draft-${itemId}`}
          className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide"
        >
          Draft reply
        </label>
        <div className="flex items-center gap-2 text-[11px] text-ink-500" aria-live="polite">
          {dirty && <span className="text-brand-600 font-medium">edited</span>}
          {isStreaming && <span className="animate-pulse-soft">streaming…</span>}
          {!isStreaming && status === 'cancelled' && (
            <span className="text-amber-700">stopped midway</span>
          )}
        </div>
      </div>
      <textarea
        id={`draft-${itemId}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.max(8, value.split('\n').length + 1)}
        className={cx(
          'w-full text-sm rounded-lg border bg-white px-3 py-2.5 leading-relaxed',
          'focus:border-brand-300 resize-y',
          isStreaming ? 'border-brand-200 bg-brand-50/30' : 'border-ink-200'
        )}
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        {isStreaming ? (
          <Button size="sm" variant="secondary" onClick={onStop}>
            Stop
          </Button>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(value)}>
              Copy
            </Button>
            <Button size="sm" variant="secondary" onClick={onRegenerate}>
              {status === 'cancelled' ? 'Retry' : 'Regenerate'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Tiny visual helpers ----------

function SectionLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide mb-1">
      {children}
    </div>
  );
}

function Tag({
  children,
  muted = false,
}: Readonly<{ children: React.ReactNode; muted?: boolean }>) {
  return (
    <span
      className={cx(
        'inline-flex items-center text-[11px] font-medium rounded-md px-2 py-0.5',
        muted
          ? 'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200'
          : 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100'
      )}
    >
      {children}
    </span>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-500" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
