# TIMELOG

Total: **~15 hours** across 4 calendar days (Fri evening → Mon night).

## 2026-05-08 (Fri, evening)

- 0.5h — Read the assignment end-to-end, called out the hard rules (no silent overwrite of user edits, schema validation as a first-class concern, race-condition safety on item switch). Sketched data shape and component boundaries on paper, picked stack (Vite + TS + Tailwind + Zustand + Zod). Decided to skip a real AI provider since the spec only requires Mock AI to work.

- 1.5h — Vite + TS scaffold, Tailwind config with named brand tokens, folder structure (`features/`, `store/`, `shared/`, `data/`), wrote the mock items dataset (~30 items, Indonesia-flavored insurance domain, including a prompt-injection spam case).

## 2026-05-09 (Sat)

- 1.5h — Items store + UI store in Zustand, base layout shell with header + two-pane grid, brand favicon (purple koala silhouette), responsive grid scaffolding.

- 2h — Inbox list: row component, status & priority badges, filter bar with status + priority radio groups, fuzzy search (subject / sender / body / tags), `useFilteredItems` memoized derivation.

- 1.5h — Bulk-select mode, BulkBar with Mark-Done, vim-style keyboard nav (j/k/Enter/e/1/2/3/[/]/x/Esc), keyboard hint strip in BulkBar, scroll-into-view for keyboard-active row.

## 2026-05-10 (Sun)

- 1h — Item detail view: header + sender meta, status/priority segmented controls, notes textarea with debounced store write-back, mobile close button.

- 2h — Mock AI deterministic generator: heuristic classifier (claims / endorsement / billing / spam with prompt-injection detection), summary / suggested-action / draft-reply templates, latency + failure + bad-JSON simulation, Zod schema with strict enums. Output is a pure function of the item; simulation noise uses Math.random so retries can recover.

- 2h — `useAIGeneration` hook: AbortController per request, monotonic request-id guard, per-item cache keyed by `itemId::PROMPT_VERSION`, three error subclasses (network / validation / abort), state machine in the AI store (idle / streaming / success / error / cancelled). Streaming draft experience wired up: async generator yielding start → chunks → done, AIAssistPanel UI with header summary + streaming textarea, Stop / Regenerate / Copy controls, partial-draft-on-stop semantics.

## 2026-05-11 (Mon)

- 1h — Edit guard: `userDraftDirty` flag, RegenerateConfirm modal with **Replace / Append / Cancel** choices, append mode wired through to the generator. Debug panel: raw JSON viewer, validation-error list, retry action; error-state copy and affordances; idle state with "Generate AI suggestions" CTA.

- 0.5h — Accessibility pass: switched modal to native `<dialog>`, added `aria-live` to streaming indicator, labelled the draft textarea, fixed focus-visible ring, ensured all filters expose `radiogroup` semantics.

- 0.5h — Responsive: mobile pane toggle (selecting an item hides the inbox; Esc returns), close button visible only below `lg`.

- 0.5h — Lighthouse pass: moved Inter font from CSS `@import` to `<link rel="preconnect"> + <link rel="stylesheet">` in HTML head; added `theme-color`, `meta description`; verified ARIA + contrast.

- 0.5h — Vercel deploy + production smoke test.

- 0.5h — README (architecture, decisions, what was cut, what's next), TIMELOG, lighthouse README.
