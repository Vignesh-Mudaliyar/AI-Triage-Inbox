# Qoala — AI Triage Inbox

A frontend-only React app that lets an ops/sales agent triage inbound customer
messages quickly, with AI-assisted summaries, classification, and an editable
draft reply. The AI is **assistive** — the user always stays in control.

> Written as a take-home for the Qoala interview process.
> Time spent: **~15h** (see [`TIMELOG.md`](./TIMELOG.md)).
> Demo: <https://ai-triage-inbox-no4y82jfk-vignesh-mudaliyars-projects.vercel.app/>

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc -b && vite build
npm run preview      # serve dist/
```

No environment variables are required — the app ships with a deterministic
**Mock AI** that simulates latency, occasional failures, and occasional
schema-invalid output.

---

## Feature summary (mapped to the spec)

### Inbox list
- Sender, subject, time-ago, channel, status, priority on every row.
- Status filter (All / New / In Progress / Done) and priority filter (All / P1 / P2 / P3).
- Client-side fuzzy search across subject, sender, body, and tags.
- Bulk-select mode with **Mark Done**.
- Empty states: "no messages match" with a clear-filters action; inbox-zero state.

### Vim-style keyboard nav
| Key | Action |
| --- | --- |
| `j` / `↓` | Next message |
| `k` / `↑` | Previous message |
| `Enter` | Open first message (when none selected) |
| `e` | Mark selected as Done |
| `1` / `2` / `3` | Set priority P1/P2/P3 |
| `[` / `]` | Cycle status backward / forward |
| `x` | Toggle bulk-select on the focused row |
| `/` | Focus search |
| `Esc` | Clear search → close detail |

### Item detail
- Full message body with sender meta + tags.
- Status + priority controls (segmented buttons, color-coded by tone).
- Internal notes field (debounced write-back to the items store).
- AI Assist panel (below).
- Real loading / streaming / error / cancelled / success states — every state
  has its own copy and affordances.

### AI Assist panel
- Summary (2–4 bullets), category, suggested next action, editable draft reply.
- **Streaming** draft generation that updates as text arrives.
- **Stop** mid-stream — partial draft remains visible.
- **Regenerate** — when the user has edits, opens a Replace / Append / Cancel
  modal (the "AI must never silently overwrite user edits" rule is taken
  literally).
- **Copy** button on the draft.
- Confidence percentage shown next to the panel header.

### Mock AI behavior
- The AI **output** is a pure function of the item: same item → same
  category, summary, draft, confidence. The **simulation noise** (latency,
  whether a call fails) uses `Math.random` on purpose, so retrying a
  transient failure can actually succeed.
- Heuristic classifier handles: claims (accident / theft / flood / preauth /
  denied), endorsements, billing (renewal / refund / pending payment /
  installment), and **spam with prompt-injection detection** (the
  `Ignore previous instructions...` payload from the spec is correctly
  classified as Spam regardless of the body's "URGENT" framing).
- Replies are language-aware: if the body looks like Bahasa Indonesia, the
  draft is written in Bahasa Indonesia; otherwise English.
- Simulated latency 200–1200 ms, ~12% network failures, ~8% schema-invalid
  payloads (truncated, wrong enum, missing field, out-of-range confidence).

### Validation + Debug mode
- All AI output is validated against a strict Zod schema before any of it
  reaches the UI.
- Debug toggle in the header surfaces the raw JSON payload, the list of Zod
  validation errors when present, and a Retry action.

---

## Architecture & key decisions

### Tech stack
- **Vite + React 19 + TypeScript** — fastest path to a small, modern bundle.
- **Tailwind CSS** with a named brand palette (Qoala-leaning purple
  `#6E2EE6`); design tokens live in `tailwind.config.js`, not scattered.
- **Zustand** for state, split across three small stores by concern:
  `itemsStore` (message data + mutations), `aiStore` (AI cache per
  `itemId::promptVersion`), `uiStore` (selection, filters, search,
  debug mode).
- **Zod** for runtime validation of AI output. The spec line _"treat AI like
  an unreliable dependency"_ is the philosophy — schema validation is the
  enforcement.

### State model
- Items, AI results, and UI state are deliberately separate. Items are
  user-owned data; AI results are computed and disposable; UI state is
  ephemeral.
- The AI cache key is `${itemId}::${PROMPT_VERSION}`. Bumping
  `PROMPT_VERSION` in `src/features/ai/schema.ts` invalidates every cached
  entry without touching them individually.
- The inbox list is sorted newest-first and memoized via
  `useFilteredItems`, recomputing only when items / query / filters change.

### Async correctness
The two classic React/LLM bugs are addressed explicitly:

1. **Race conditions on item switch.** `useAIGeneration` owns an
   `AbortController` per generation. The effect's cleanup function aborts
   when the active item changes or the panel unmounts.
2. **Stale events.** A monotonically-increasing request id is captured at
   the start of each `generate()` call. Every event handler checks the id
   before patching state. `AbortController` is cooperative — the id guard
   closes the gap between iterations.

### Streaming model
The mock AI is an `async function*` that yields three event kinds:
`{type:'start'}` (the validated header without `draft_reply`), one or more
`{type:'chunk'}` events that build up `draft_reply` word-by-word, and
`{type:'done'}`. Validation happens once, against the full payload, before
any chunk is yielded — so streaming is purely presentational and we never
expose unvalidated data to the UI. The same primitive (`AbortSignal`)
cancels both the latency sleep and the chunk loop.

### "AI never overwrites user edits"
Each item's AI state holds two strings: `aiDraft` (what the model produced)
and `userDraft` (what the user sees and types into). While streaming, we
mirror new chunks into `userDraft` only if the user hasn't typed yet
(`!userDraftDirty`). Once they type, the mirror stops. Regenerate from a
dirty draft opens a modal with **Replace** / **Append** / **Cancel** —
explicit consent before any text is replaced.

### Rendering discipline
- `InboxRow` is `React.memo`'d.
- Selectors in Zustand keep components subscribed to only the slice they
  read.
- I deliberately did **not** memoize every component; profiling didn't
  justify it and over-memoization is its own problem.

### Accessibility
- Native `<dialog>` element for the regenerate modal — Esc-to-close, focus
  management, and inert backdrop are handled by the platform.
- `aria-live="polite"` on streaming status indicators.
- Focus-visible ring driven by the brand color.
- All filters use a `radiogroup` pattern; bulk-select rows have proper
  checkbox labels.
- Keyboard nav is a first-class feature, not a fallback.

### Responsive
- Desktop: two-pane layout (`420px` list / `1fr` detail).
- Mobile: panes flip — opening a message hides the list, closing returns to
  the list. The close button is visible only below `lg`.

---

## Performance — what I changed and what I didn't

### Changed
- Inter loaded via `<link rel="preconnect">` + `<link rel="stylesheet">`
  in HTML rather than CSS `@import` (the latter postpones the request to
  after CSS parsing).
- `font-display: swap` (via the Google Fonts URL) so first paint isn't
  font-blocked.
- Tailwind JIT keeps the production CSS at ~5KB gzipped.
- `theme-color`, `meta description`, `lang="en"`, and a real favicon to
  satisfy Lighthouse Best Practices.

### Did **not** optimize, on purpose
- **No code-splitting / lazy routes.** This is effectively a single screen;
  splitting would only add overhead without improving LCP.
- **No virtualization** of the inbox list. With 30 items it isn't
  warranted; for 1000+ I would swap in `@tanstack/react-virtual` and pay
  the bundle cost.
- **No service worker / offline cache.** Out of scope and would slow the
  first build down for nothing measurable.

Lighthouse screenshots live in [`./lighthouse/`](./lighthouse) (run
instructions in that folder's README).

---

## Project layout

```
src/
  app/                     top-level layout (App, Header)
  features/
    inbox/                 list, filters, search, bulk, keyboard nav
    detail/                message body, status/priority, notes
    ai/                    schema, mock AI, hook, panel, debug, regen modal
  shared/
    ui/                    Button, Badge, Modal
    utils/                 cx, time
  store/                   itemsStore, uiStore, aiStore (Zustand)
  data/mockItems.ts        ~30 realistic Indonesia-flavored items
  types.ts                 cross-feature types
```

Feature folders, not type folders — concerns belong with their feature.

---

## What I cut / would do next with more time

**Cut:**
- Real AI provider integration. Spec said optional; building it would have
  burned time on a feature that the rubric doesn't reward.
- Item-level virtualization (overkill at this dataset size).
- Persistence to `localStorage` (the brief is a pure frontend exercise, and
  reload-stable demo isn't part of the rubric).

**Would do next:**
- Toast confirmation on bulk-done so the action feels reversible.
- Undo for status / priority changes (Cmd-Z).
- Threading: group multi-message conversations into a single row.
- A small E2E test in Playwright that runs the keyboard-nav golden path
  (j → e → / → enter → Esc).
- A real provider behind a toggle, with a streaming SSE adapter sharing
  the same `AbortController` plumbing.

---

## Deploy

```bash
npx vercel --prod
```

Vercel auto-detects Vite via `vercel.json`. No build env required.

---

## License

Internal — interview submission only.
