# Epic 6 — Facets: synthesis, the portrait's abstract, field notes

Implements `docs/design/facets.md`. Shape rules as ever: pure modules
compute, I/O wrappers glue, components render props; no unit mocks more
than two collaborators.

Type facts (develop): entry models `LikesEntry`/`DislikesEntry`/`Joke` carry
`text String`; `Dream` carries `description String`; `Trip` carries
`destination String`. All five carry `source String @default("manual")`.
`Portrait` in `src/lib/portrait/load.ts` has optional `entries?:
PortraitEntries` with `EntryRow = { id, text, source }`.

---

## Story 1 — Facet schema

**Files to modify:**
- `prisma/schema.prisma`

**Acceptance Criteria:**
- A new model `Facet` appended after `CadenceRun`: fields exactly `id String @id @default(cuid())`, `profileId String`, `section String`, `label String`, `evidenceCount Int @default(0)`, `firstNoted DateTime @default(now())`, `lastReinforced DateTime @default(now())`, `status String @default("active")`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`. Add `@@index([profileId, section])`.
- The `Profile` model gains inverse array `facets Facet[]`, and two scalar fields after `updatedAt`: `portraitSummary String?`, `summaryUpdatedAt DateTime?`.
- Each of `LikesEntry`, `DislikesEntry`, `Joke`, `Dream`, `Trip` gains exactly one field after `source`: `facetId String?`. (A plain nullable string — no relation attribute, to keep the write path free of relation constraints.)
- No other model, field, or attribute is added, removed, or reordered.
- Running `prisma generate` (no live DB required) completes without error.

**Testing:** not applicable — Prisma schema file; there is no vitest unit under test.

---

## Story 2 — Synthesis prompt

**Files to create:**
- `src/lib/facets/prompt.ts`
- `src/lib/facets/prompt.test.ts`

**Acceptance Criteria:**
- Exports `buildSynthesisPrompt(input: SynthesisInput): string` and the type `SynthesisInput` — the SOLE exports of `src/lib/facets/prompt.ts`. Implement `buildSynthesisPrompt` exactly once; do NOT emit an alternate variant or re-export.
- `SynthesisInput` is `{ partnerName: string; section: string; facets: { id: string; label: string; status: string }[]; observations: { index: number; text: string }[] }`.
- Imports nothing. Pure function.
- The prompt explains the task: cluster the numbered observations about the partner into findings for the given `section`; assign each observation index either to an EXISTING facet by its `id` or to a NEW facet with a short canonical label (2–6 words, about the partner, no meta-language).
- Instructs: return ONLY a JSON object of the shape `{ "assignments": [{ "facetId": string | null, "label": string | null, "observations": number[] }] }` — `facetId` set (and `label` null) to reinforce an existing facet; `label` set (and `facetId` null) to create a new one. An observation index may appear at most once; indices not confidently placed must be OMITTED, never guessed.
- Lists each existing facet as `id: label` — but facets whose `status` is `rejected` are listed separately under an instruction that these labels were rejected by the user and must NOT be recreated, under this or any similar phrasing.
- Lists each observation as `index: text`, and includes the partner's name.
- `src/lib/facets/prompt.test.ts` imports ONLY `{ buildSynthesisPrompt }` from `'./prompt'`. Does NOT use `vi.mock`.
- Test "numbers the observations": builds with observations `[{ index: 0, text: 'gardening' }, { index: 1, text: 'planting herbs' }]`; asserts the result contains `'0: gardening'` and `'1: planting herbs'`.
- Test "offers existing facets by id": builds with facets `[{ id: 'f1', label: 'order at home', status: 'active' }]`; asserts the result contains `'f1'` and `'order at home'`.
- Test "rejected labels are forbidden, not offered": builds with facets `[{ id: 'f2', label: 'bad label', status: 'rejected' }]`; asserts the result contains `'bad label'` and a case-insensitive match of `/not|never/` within 200 characters of it.

**Testing:**
- Test numbers the observations
- Test offers existing facets by id
- Test rejected labels are forbidden, not offered

---

## Story 3 — Synthesis parser

**Files to create:**
- `src/lib/facets/parse.ts`
- `src/lib/facets/parse.test.ts`

**Acceptance Criteria:**
- Exports `parseSynthesis(raw: string, observationCount: number): Assignment[]` and the type `Assignment` — the SOLE exports of `src/lib/facets/parse.ts`. Implement `parseSynthesis` exactly once; do NOT emit an alternate variant or re-export.
- `Assignment` is `{ facetId: string | null; label: string | null; observations: number[] }`.
- Imports nothing. Pure. NEVER throws — any failure returns `[]`.
- Locates the JSON candidate from the first `{` to the last `}` in `raw`; parses inside try/catch; reads `assignments` if it is an array, else returns `[]`.
- Keeps only well-formed assignments: exactly one of `facetId`/`label` is a non-empty string (the other null or absent → normalized to null); `label`, when present, is trimmed and at most 60 characters; `observations` is an array of integers in `[0, observationCount)`.
- Deduplicates observation indices ACROSS assignments — an index claimed twice stays with its first assignment only. An assignment left with zero observations is dropped.
- Caps the result at 10 assignments.
- `src/lib/facets/parse.test.ts` imports ONLY `{ parseSynthesis }` from `'./parse'`. Does NOT use `vi.mock`.
- Test "parses reinforcement and creation": raw `'{"assignments": [{"facetId": "f1", "observations": [0, 2]}, {"label": "japanese food", "observations": [1]}]}'` with count 3; asserts the result equals `[{ facetId: 'f1', label: null, observations: [0, 2] }, { facetId: null, label: 'japanese food', observations: [1] }]`.
- Test "malformed input is empty": `parseSynthesis('nope', 5)` and `parseSynthesis('{"assignments": "x"}', 5)` both equal `[]`.
- Test "out-of-range and duplicate indices are dropped": raw assigning `[0, 7]` to one facet and `[0]` to another, with count 3; asserts the first keeps `[0]`, and the second (left empty) is dropped.
- Test "an assignment with both ids is dropped": raw with `{"facetId": "f1", "label": "x", "observations": [0]}` and count 1; asserts the result is `[]`.

**Testing:**
- Test parses reinforcement and creation
- Test malformed input is empty
- Test out-of-range and duplicate indices are dropped
- Test an assignment with both ids is dropped

---

## Story 4 — Stale marking and facet ordering

**Files to create:**
- `src/lib/facets/order.ts`
- `src/lib/facets/order.test.ts`

**Acceptance Criteria:**
- Exports `staleIds(facets: FacetLite[], today: Date): string[]` and `orderFacets(facets: FacetLite[]): FacetLite[]` and the type `FacetLite` — the SOLE exports of `src/lib/facets/order.ts`. Implement each exactly once; do NOT emit alternate variants or re-exports.
- `FacetLite` is `{ id: string; label: string; status: string; evidenceCount: number; lastReinforced: Date }`.
- Imports nothing. Pure functions; `today` is a parameter — no clock reads.
- `staleIds` returns the ids of facets whose `status` is `'active'` and whose `lastReinforced` is more than 60 days (60 × 86,400,000 ms) before `today`.
- `orderFacets` returns a new array: active facets first (by `evidenceCount` descending, ties by `label` ascending), then stale ones (same ordering); facets with `status` `'rejected'` are excluded entirely.
- `src/lib/facets/order.test.ts` imports ONLY the two functions from `'./order'`. Does NOT use `vi.mock` and does NOT use fake timers.
- Test "marks only long-unreinforced active facets stale": one active facet reinforced 61 days before today, one 59 days before, one already-stale facet at 100 days; asserts only the first's id is returned.
- Test "orders by evidence with stale last and rejected gone": active facets with counts 2 and 5, a stale facet with count 9, a rejected facet; asserts the order is [count-5 active, count-2 active, stale] and the rejected one is absent.

**Testing:**
- Test marks only long-unreinforced active facets stale
- Test orders by evidence with stale last and rejected gone

---

## Story 5 — Synthesize one section

**Depends on:** Story 1, Story 2, Story 3

**Files to create:**
- `src/lib/facets/synthesize.ts`
- `src/lib/facets/synthesize.test.ts`

**Acceptance Criteria:**
- Exports `synthesizeSection(profileId: string, section: FacetSection): Promise<number>` and the type `FacetSection` — the SOLE exports of `src/lib/facets/synthesize.ts`; the number is how many observations were newly assigned. Implement `synthesizeSection` exactly once; do NOT emit an alternate variant or re-export.
- `FacetSection` is `'likes' | 'dislikes' | 'jokes' | 'dreams' | 'trips'`.
- Imports `prisma` from `'@/lib/db'`, `generate` from `'@/lib/ai'`, `buildSynthesisPrompt` from `'@/lib/facets/prompt'`, and `parseSynthesis` from `'@/lib/facets/parse'`. No other imports.
- The section→model map, each model's own text column: `likes` → `prisma.likesEntry` (`text`), `dislikes` → `prisma.dislikesEntry` (`text`), `jokes` → `prisma.joke` (`text`), `dreams` → `prisma.dream` (`description`), `trips` → `prisma.trip` (`destination`).
- Loads the profile (`prisma.profile.findUnique`; `null` → return `0` without calling `generate`), the section's facets (`prisma.facet.findMany({ where: { profileId, section } })`), and the section's UNASSIGNED observations (`findMany({ where: { profileId, facetId: null } })`). Zero unassigned observations → return `0` without calling `generate`.
- Builds the prompt with observations numbered by array position (`index` = position, `text` = the model's own text column), calls `generate`, parses with `parseSynthesis(raw, observations.length)`.
- Applies each assignment: for a `facetId`, verify it is one of the loaded facets (skip the assignment otherwise), set each observation's `facetId` via the section model's `update`, and update the facet with `evidenceCount: { increment: <n> }` and `lastReinforced` set to a new Date. For a `label`, create the facet first (`prisma.facet.create` with `profileId`, `section`, `label`, `evidenceCount: <n>`) then assign the observations to its id.
- Returns the total observations assigned.
- `src/lib/facets/synthesize.test.ts` mocks `'@/lib/db'` and `'@/lib/ai'` ONLY — prompt and parse are pure local modules. The db mock covers `profile.findUnique`, `facet.findMany`, `facet.create`, `facet.update`, and for the five entry models `findMany` + `update`. `as never` on Prisma mock resolutions.
- Test "creates a facet and assigns its observations": profile resolves, no facets, two unassigned likes rows (`id: 'l1'`/`'l2'`, `text` values); `generate` resolves `'{"assignments": [{"label": "order at home", "observations": [0, 1]}]}'`; `facet.create` resolves `{ id: 'f9' }`; asserts the result is `2`, `facet.create` received `label: 'order at home'` and `evidenceCount: 2`, and `likesEntry.update` was called twice with `data: { facetId: 'f9' }`.
- Test "reinforces an existing facet": one facet `{ id: 'f1', ... }`, one unassigned row; `generate` resolves an assignment to `'f1'`; asserts `facet.update` was called with `where: { id: 'f1' }` and a `data` containing `evidenceCount: { increment: 1 }`.
- Test "an unknown facet id is skipped": `generate` assigns to `'f404'` which is not among loaded facets; asserts the result is `0` and no `update` was called.
- Test "nothing unassigned means no model call": entry `findMany` resolves `[]`; asserts the result is `0` and `generate` was not called.

**Testing:**
- Test creates a facet and assigns its observations
- Test reinforces an existing facet
- Test an unknown facet id is skipped
- Test nothing unassigned means no model call

---

## Story 6 — Compose the portrait's abstract

**Depends on:** Story 1

**Files to create:**
- `src/lib/facets/summary.ts`
- `src/lib/facets/summary.test.ts`

**Acceptance Criteria:**
- Exports `composePortraitSummary(profileId: string): Promise<string | null>` — the SOLE export of `src/lib/facets/summary.ts`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- Imports `prisma` from `'@/lib/db'` and `generate` from `'@/lib/ai'`. No other imports.
- Loads the profile (`null` → return `null`) and its ACTIVE facets (`prisma.facet.findMany({ where: { profileId, status: 'active' } })`). Fewer than 3 active facets → return `null` without calling `generate` — an abstract of two findings is padding.
- Calls `generate` with a prompt that includes the partner's name and every active facet as `section: label`, and instructs: write 2–3 warm sentences describing the partner USING ONLY these findings; never add facts, names, or dates that are not in the list; no preamble, no markdown.
- Trims the result; when non-empty, stores it via `prisma.profile.update` with `portraitSummary` and `summaryUpdatedAt: <a new Date()>`, and returns it. An empty result or a thrown `generate` returns `null` without writing.
- `src/lib/facets/summary.test.ts` mocks `'@/lib/db'` (`profile.findUnique`, `profile.update`, `facet.findMany`) and `'@/lib/ai'` ONLY.
- Test "composes and stores from active facets": profile `{ id: 'p1', name: 'Yoyo' }`, three active facets; `generate` resolves `'She is a maker of order.'`; asserts the return equals that string and `profile.update` received a `data` containing `portraitSummary: 'She is a maker of order.'`.
- Test "too few facets means no call and no write": two facets; asserts `null`, `generate` not called, `update` not called.
- Test "a model failure writes nothing": `generate` rejects; asserts `null` and `update` not called.

**Testing:**
- Test composes and stores from active facets
- Test too few facets means no call and no write
- Test a model failure writes nothing

---

## Story 7 — Weekly synthesis on the cron

**Depends on:** Story 4, Story 5, Story 6

**Files to modify:**
- `src/app/api/cron/route.ts`
- `src/app/api/cron/route.test.ts`

**Acceptance Criteria:**
- `GET(request: Request): Promise<Response>` remains the SOLE export of `src/app/api/cron/route.ts`, and everything the route does today is unchanged.
- New imports: `synthesizeSection` from `'@/lib/facets/synthesize'`, `composePortraitSummary` from `'@/lib/facets/summary'`, and `staleIds` from `'@/lib/facets/order'`.
- After the existing cadence sends, ONLY when the day's `dueCadences` includes `'weekly'`: for each profile that was processed, (1) call `synthesizeSection(profileId, s)` for each of the five sections in order `likes`, `dislikes`, `jokes`, `dreams`, `trips`; (2) load the profile's facets and mark `staleIds(facets, today)` stale via `prisma.facet.updateMany({ where: { id: { in: <ids> } }, data: { status: 'stale' } })` — skip the call when the list is empty; (3) call `composePortraitSummary(profileId)`. The whole block is wrapped in try/catch and failures are swallowed — synthesis must never break the check-ins.
- The response JSON gains a numeric field `synthesized` — total observations assigned across sections (0 on non-weekly days).
- `src/app/api/cron/route.test.ts` keeps every existing test case's name and assertions, and additionally mocks `'@/lib/facets/synthesize'`, `'@/lib/facets/summary'` (both I/O wrappers), with `'@/lib/facets/order'` NOT mocked (pure). The db mock gains `facet: { findMany: vi.fn(), updateMany: vi.fn() }` resolving `[]`/`{}` by default; `synthesizeSection` resolving `1`; `composePortraitSummary` resolving `null`.
- Existing tests pin any date they need; tests for the weekly path use a Sunday (e.g. mock the system time OR assert conditionally) — simplest honest form: the new tests use `vi.setSystemTime(new Date('2026-08-23T13:00:00Z'))` (a Sunday) inside the test and `vi.useRealTimers()` after.
- Test "weekly runs synthesis for the five sections": Sunday; asserts `synthesizeSection` was called 5 times for profile `'p1'` (once per section) and `composePortraitSummary` once.
- Test "a plain weekday synthesizes nothing": a Monday; asserts `synthesizeSection` was not called and the JSON body's `synthesized` is `0`.
- Test "synthesis failure does not break the check-in": Sunday, `synthesizeSection` rejects; asserts the response status is still 200 and `sendMessage` was still called.

**Testing:**
- Test weekly runs synthesis for the five sections
- Test a plain weekday synthesizes nothing
- Test synthesis failure does not break the check-in

---

## Story 8 — Facets and the abstract in the loader

**Depends on:** Story 1

**Files to modify:**
- `src/lib/portrait/load.ts`
- `src/lib/portrait/load.test.ts`

**Acceptance Criteria:**
- `Portrait` gains two OPTIONAL fields — `summary?: string | null` and `facets?: FacetView[]` — and the new exported type `FacetView`: `{ id: string; section: string; label: string; status: string; evidenceCount: number }`. Do NOT change any existing `Portrait` field; existing exports all remain.
- `getPortrait`'s single `findUnique` gains `facets: { where: { status: { not: 'rejected' } } }` in its `include`, and the return populates `summary` from `profile.portraitSummary` and `facets` mapped to the `FacetView` shape.
- Every existing test case keeps its name and assertions (mock profiles gain `facets: []` and `portraitSummary: null` where needed).
- New test "facets and summary ride along": mocks a profile with `portraitSummary: 'She is a maker of order.'` and one facet row; asserts `portrait.summary` equals the string and `portrait.facets` has length 1 with `label` intact.

**Testing:**
- Test returns null for an unknown profile
- Test maps text rows to plain strings
- Test facets and summary ride along

---

## Story 9 — Facet section component

**Depends on:** Story 8

**Files to create:**
- `src/components/FacetSection.tsx`
- `src/components/FacetSection.test.tsx`

**Acceptance Criteria:**
- The file's first line is the directive `'use client'` (it holds open/closed state for the field notes). Default-exports a component named `FacetSection` — the SOLE export.
- Props: `{ title: string; field: EditableField; facets: FacetView[]; rows: EntryRow[] }`. Imports `useState` from `'react'`, `EditableChip` (default) from `'@/components/EditableChip'`, the type `EditableField` from `'@/app/actions/editEntry'`, and the types `FacetView`, `EntryRow` from `'@/lib/portrait/load'`. No other imports.
- When `facets` is non-empty: renders the title, then one row per facet (in the given order) showing its `label` and, in a smaller muted span, `×{evidenceCount}` — each row carries `data-testid="facet-row"`, and a facet whose `status` is `'stale'` gets a muted style and the exact suffix text `fading`.
- Below the facets, a toggle button with the accessible name `` `Field notes (${rows.length})` `` that shows/hides the raw observations as `EditableChip`s in a `<ul>` (hidden by default).
- When `facets` is empty: renders exactly the chips-as-today fallback — the title and the `EditableChip` list (no toggle, chips visible), or the `Nothing here yet.` paragraph when `rows` is also empty.
- The root element carries `data-testid="portrait-section"`.
- `src/components/FacetSection.test.tsx` mocks `'@/app/actions/editEntry'` (the chips import it) — the ONLY mock. Imports `{ render, screen }` from `'@testing-library/react'` and `userEvent` (default).
- Test "renders weighted facets with hidden notes": two facets (counts 5 and 2) and three rows; asserts two `facet-row`s, the text `×5`, and that no chip text is visible before the toggle.
- Test "field notes open on demand": clicks `Field notes (3)`; asserts a known chip text becomes visible.
- Test "no facets falls back to chips": `facets={[]}` with two rows; asserts both chip texts are visible and no `facet-row` exists.
- Test "a stale facet says fading": one facet with `status: 'stale'`; asserts the text `fading` is present.

**Testing:**
- Test renders weighted facets with hidden notes
- Test field notes open on demand
- Test no facets falls back to chips
- Test a stale facet says fading

---

## Story 10 — The portrait reads its abstract

**Depends on:** Story 9

**Files to modify:**
- `src/components/PortraitView.tsx`
- `src/components/PortraitView.test.tsx`

**Acceptance Criteria:**
- The header, after the dates line: when `portrait.summary` is a non-empty string, renders it in a `<p>` with `data-testid="portrait-summary"`, styled with the display serif in a readable size (presentation free, behaviour pinned: the text renders verbatim).
- The five `EditableSection` usages are REPLACED by `FacetSection` (import swap), each receiving the same `title`/`field`/`rows` as today plus `facets={(portrait.facets ?? []).filter((f) => f.section === '<field>')}` for its own field.
- Nothing else changes — `StudyMetrics`, `GiftHistory`, `MoodTimeline`, the forms, and all remaining layout stay exactly as they are.
- `src/components/PortraitView.test.tsx` keeps every existing test case's name; the mock set gains what `FacetSection` transitively needs (it already mocks `'@/app/actions/editEntry'` and `'@/app/actions/rateGift'`).
- Test "renders the name and all sections" (kept): five `portrait-section` testids still present (the fallback path).
- New test "the abstract renders when present": fixture with `summary: 'She is a maker of order.'`; asserts the `portrait-summary` testid carries that text.
- New test "facets route to their section": fixture with one facet `{ id: 'f1', section: 'likes', label: 'order at home', status: 'active', evidenceCount: 4 }`; asserts the text `order at home` is present and exactly one `facet-row` exists.

**Testing:**
- Test renders the name and all sections
- Test the abstract renders when present
- Test facets route to their section
