import { useEffect, useState } from 'react';
import { useItemsStore } from '../../store/itemsStore';

export function NotesField({ id, initial }: { id: string; initial: string }) {
  const setNotes = useItemsStore((s) => s.setNotes);
  const [draft, setDraft] = useState(initial);

  // Keep local input in sync if a different item is selected.
  useEffect(() => {
    setDraft(initial);
  }, [id, initial]);

  // Debounce writes back to the store so we don't thrash on every keystroke.
  useEffect(() => {
    if (draft === initial) return;
    const t = setTimeout(() => setNotes(id, draft), 250);
    return () => clearTimeout(t);
  }, [draft, id, initial, setNotes]);

  return (
    <div>
      <label
        htmlFor={`notes-${id}`}
        className="block text-xs font-semibold text-ink-700 uppercase tracking-wide mb-1.5"
      >
        Internal notes
      </label>
      <textarea
        id={`notes-${id}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Context for the next teammate who picks this up…"
        rows={3}
        className="w-full text-sm rounded-lg bg-white border border-ink-200 px-3 py-2
                   placeholder:text-ink-500 focus:border-brand-300 resize-y"
      />
    </div>
  );
}
