import { useCallback, useEffect, useRef } from 'react';
import type { InboxItem } from '../../types';
import { useAIStore, type AIError, type AIItemState } from '../../store/aiStore';
import { runMockAI, type AIEvent } from './mockAI';
import { AIAbortError, AINetworkError, AIValidationError } from './errors';
import { PROMPT_VERSION } from './schema';

export interface AIGenerationApi {
  cacheKey: string;
  state: AIItemState;
  isInFlight: boolean;
  generate: (mode?: 'fresh' | 'append') => Promise<void>;
  stop: () => void;
}

type Patch = (key: string, patch: Partial<AIItemState>) => void;

/**
 * Owns the lifecycle of a single item's AI generation.
 *
 * Correctness primitives:
 *   1. AbortController per generation. Aborts fire on stop, item switch, or
 *      unmount.
 *   2. A monotonically-increasing request id. If a slow generator yields after
 *      the user re-triggered, stale events are dropped. AbortController is
 *      cooperative; the id guard closes the gap between iterations.
 *   3. Cache key includes PROMPT_VERSION, so bumping the prompt logic
 *      invalidates everything without touching individual entries.
 */
export function useAIGeneration(item: InboxItem): AIGenerationApi {
  const cacheKey = `${item.id}::${PROMPT_VERSION}`;

  const state = useAIStore((s) => s.byId[cacheKey] ?? DEFAULT_STATE);
  const patch = useAIStore((s) => s.patch);

  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [cacheKey]);

  const generate = useCallback<AIGenerationApi['generate']>(
    async (mode = 'fresh') => {
      controllerRef.current?.abort();
      const ctrl = new AbortController();
      controllerRef.current = ctrl;
      const myId = ++requestIdRef.current;
      const superseded = () => myId !== requestIdRef.current;

      const baseDraft =
        mode === 'append' ? useAIStore.getState().get(cacheKey).userDraft : '';

      patch(cacheKey, openingPatch(baseDraft, mode));

      try {
        for await (const ev of runMockAI(item, { signal: ctrl.signal })) {
          if (superseded()) return;
          applyEvent(cacheKey, ev, baseDraft, patch);
        }
      } catch (err) {
        // A newer generation has already claimed the state — don't overwrite it.
        // An abort from *this* request still needs to land as 'cancelled'.
        if (superseded()) return;
        patch(cacheKey, errorPatch(err));
      }
    },
    [item, cacheKey, patch]
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  return {
    cacheKey,
    state,
    isInFlight: state.status === 'streaming',
    generate,
    stop,
  };
}

const DEFAULT_STATE: AIItemState = {
  status: 'idle',
  aiDraft: '',
  userDraft: '',
  userDraftDirty: false,
};

function openingPatch(baseDraft: string, mode: 'fresh' | 'append'): Partial<AIItemState> {
  return {
    status: 'streaming',
    header: undefined,
    aiDraft: '',
    userDraft: baseDraft,
    userDraftDirty: mode === 'append',
    raw: undefined,
    error: undefined,
  };
}

function applyEvent(key: string, ev: AIEvent, baseDraft: string, patch: Patch): void {
  if (ev.type === 'start') {
    patch(key, { header: ev.header, raw: ev.raw });
    return;
  }
  if (ev.type === 'chunk') {
    const cur = useAIStore.getState().get(key);
    const nextAI = cur.aiDraft + ev.delta;
    // Only mirror the AI text into the user-visible draft when the user
    // hasn't typed. Once they've edited, we never silently overwrite.
    const nextUser = cur.userDraftDirty ? cur.userDraft : baseDraft + nextAI;
    patch(key, { aiDraft: nextAI, userDraft: nextUser });
    return;
  }
  if (ev.type === 'done') {
    patch(key, { status: 'success' });
  }
}

function errorPatch(err: unknown): Partial<AIItemState> {
  if (err instanceof AIAbortError) {
    return { status: 'cancelled' };
  }
  if (err instanceof AIValidationError) {
    const aiError: AIError = {
      kind: 'invalid',
      message: err.message,
      issues: err.issues,
      raw: err.raw,
    };
    return { status: 'error', raw: err.raw, error: aiError };
  }
  if (err instanceof AINetworkError) {
    return { status: 'error', error: { kind: 'network', message: err.message } };
  }
  const message = err instanceof Error ? err.message : 'Unexpected AI error';
  return { status: 'error', error: { kind: 'network', message } };
}
