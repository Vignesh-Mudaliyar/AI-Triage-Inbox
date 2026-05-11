import { useAIStore } from '../../store/aiStore';
import { Button } from '../../shared/ui/Button';

interface Props {
  cacheKey: string;
  onRetry: () => void;
}

export function DebugPanel({ cacheKey, onRetry }: Readonly<Props>) {
  const state = useAIStore((s) => s.byId[cacheKey]);

  if (!state) return null;

  return (
    <details
      className="rounded-xl bg-ink-900 text-ink-100 text-xs font-mono overflow-hidden"
      open
    >
      <summary className="px-4 py-2 cursor-pointer select-none flex items-center gap-2 bg-ink-900/95">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-300" />
        <span className="font-sans font-medium">Debug — raw AI output</span>
        <span className="ml-auto font-sans text-ink-300">status: {state.status}</span>
      </summary>

      <div className="p-4 space-y-3">
        {state.error && (
          <div className="space-y-1">
            <div className="text-red-300 font-sans font-semibold">
              {state.error.kind === 'network' ? 'Network error' : 'Schema validation failed'}
            </div>
            <div className="text-red-200">{state.error.message}</div>
            {state.error.issues && state.error.issues.length > 0 && (
              <ul className="list-disc list-inside text-red-200 space-y-0.5">
                {state.error.issues.map((iss) => (
                  <li key={iss}>{iss}</li>
                ))}
              </ul>
            )}
            <div className="pt-2">
              <Button size="sm" variant="primary" onClick={onRetry}>
                Retry generation
              </Button>
            </div>
          </div>
        )}

        {state.raw && (
          <pre className="whitespace-pre-wrap break-words text-ink-200 leading-relaxed">
            {state.raw}
          </pre>
        )}

        {!state.raw && !state.error && (
          <div className="text-ink-300 font-sans">
            No AI output yet for this item.
          </div>
        )}
      </div>
    </details>
  );
}
