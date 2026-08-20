# Epic 7 — The coach reads the study

Closes the loop: facets, the abstract, and gift outcomes reach the coach's
context; idea-asks route to the suggestion engine that has sat unwired since
epic 2. Design rule applied from epic 6's lesson: stories here consume ZERO
contracts created by sibling stories — each builds only on modules already
landed on develop.

Type facts (develop): `ProfileContext` in `src/lib/profile/context.ts` has
`name`, six `string[]` lists, `recentMoods`, `recentEvents`, and optional
`occasions`. `Facet` rows carry `section`, `label`, `status`,
`evidenceCount`. `Profile` carries `portraitSummary String?`.
`generateSuggestion(profileId, kind, audience)` from
`'@/lib/suggestions/generate'` exists, tested, and is currently called by
nothing.

---

## Story 1 — The context carries the study

**Files to modify:**
- `src/lib/profile/context.ts`
- `src/lib/profile/context.test.ts`

**Acceptance Criteria:**
- `getProfileContext(profileId: string): Promise<ProfileContext | null>` is the SOLE function export of `src/lib/profile/context.ts` — unchanged.
- `ProfileContext` gains three OPTIONAL fields (do NOT change any existing field): `summary?: string | null`, `facets?: { section: string; label: string; evidenceCount: number }[]`, `giftRecord?: { description: string; howItLanded: string | null }[]`.
- The single `findUnique` gains `facets: { where: { status: 'active' } }` in its `include`. The return populates `summary` from `profile.portraitSummary`, `facets` mapped to the three-field shape above, and `giftRecord` from the already-included gifts (`description` and `howItLanded`).
- Every existing test case keeps its name and assertions; mock profiles gain `facets: []` and `portraitSummary: null` where the new mapping needs them (use `?? []` tolerance in the mapper exactly as the occasions mapping does).
- New test "the study rides along": mocks a profile with `portraitSummary: 'She is a maker of order.'`, one active facet (`section: 'likes', label: 'order at home', evidenceCount: 3` — mock the row with `as never`), and one gift `{ description: 'record player', howItLanded: 'hit' }`; asserts `summary`, `facets[0].label`, and `giftRecord[0].howItLanded` all arrive intact.

**Testing:**
- Test returns null for an unknown profile
- Test maps relations to plain strings
- Test the study rides along

---

## Story 2 — The coach prompt opens with understanding

**Depends on:** Story 1

**Files to modify:**
- `src/lib/coach/prompt.ts`
- `src/lib/coach/prompt.test.ts`

**Acceptance Criteria:**
- `buildCoachPrompt(context, history, userMessage)` remains the SOLE export of `src/lib/coach/prompt.ts` with its exact current signature. It stays a pure function.
- When `context.summary` is a non-empty string, the prompt includes, before any section lists, a line containing exactly `What you understand about` followed by the partner's name and the summary text.
- When `context.facets` is non-empty: for each section that HAS at least one facet, the prompt renders a findings line — the section heading followed by each facet as `label (×evidenceCount)` — INSTEAD of that section's raw list. Sections with no facets keep their existing raw rendering unchanged. The facet sections map to headings: `likes` → `Likes:`, `dislikes` → `Dislikes:`, `jokes` → `Jokes:`, `dreams` → `Dreams:`, `trips` → `Past trips:`.
- When `context.giftRecord` is non-empty, the prompt renders a `Gift record:` section with one line per gift — its description and the exact word `landed` when `howItLanded` is `'hit'`, `missed` when `'miss'`, `unrated` otherwise — replacing the existing `Past gifts:` list.
- When the new optional fields are absent (`undefined`), the prompt renders EXACTLY as it does today — the existing tests prove this by passing unchanged.
- Every existing test case keeps its name and assertions unchanged.
- New test "opens with the understanding": builds with `{ ...base, summary: 'She is a maker of order.' }`; asserts the result contains `What you understand about` and the summary text, and that its index is lower than the index of any `Likes:` heading if present.
- New test "findings replace raw lists per section": builds with `{ ...base, likes: ['orderliness', 'cleanliness'], facets: [{ section: 'likes', label: 'order at home', evidenceCount: 3 }] }`; asserts the result contains `order at home (×3)` and does NOT contain `orderliness`.
- New test "gift outcomes are named": builds with `{ ...base, giftRecord: [{ description: 'record player', howItLanded: 'hit' }, { description: 'perfume set', howItLanded: 'miss' }] }`; asserts the result contains `record player` within a line containing `landed`, and `perfume set` within a line containing `missed`.

**Testing:**
- Test includes the partner name
- Test includes populated sections
- Test omits empty sections
- Test opens with the understanding
- Test findings replace raw lists per section
- Test gift outcomes are named

---

## Story 3 — Idea-ask detection

**Files to create:**
- `src/lib/coach/ideaAsk.ts`
- `src/lib/coach/ideaAsk.test.ts`

**Acceptance Criteria:**
- Exports `detectIdeaAsk(message: string): Promise<IdeaAsk | null>` and the type `IdeaAsk` — the SOLE exports of `src/lib/coach/ideaAsk.ts`. Implement `detectIdeaAsk` exactly once; do NOT emit an alternate variant or re-export.
- `IdeaAsk` is `{ kind: 'date' | 'gift' | 'trip'; audience: 'for_her' | 'for_us' | 'for_family' }`.
- Imports `generate` from `'@/lib/ai'`. No other imports.
- Calls `generate` with a prompt asking: is this message a request for a concrete date, gift, or trip idea? Reply `NONE`, or exactly two words: the kind (`date`/`gift`/`trip`) and the audience (`for_her` when it is for the partner alone, `for_us` for the couple, `for_family` for the whole family; default `for_us` when unclear).
- Parses the reply case-insensitively: `NONE` or anything unparseable returns `null`; a valid kind with a missing/invalid audience uses `for_us`. A thrown `generate` returns `null` — detection failing must never break the conversation.
- `src/lib/coach/ideaAsk.test.ts` mocks `'@/lib/ai'` with `vi.mock('@/lib/ai', () => ({ generate: vi.fn() }))` — the file's ONLY mock.
- Test "detects a gift ask for her": mocks `generate` resolving `'gift for_her'`; asserts `detectIdeaAsk('what should I get her for her birthday?')` resolves to `{ kind: 'gift', audience: 'for_her' }`.
- Test "NONE and garbage are null": mocks `'NONE'` then `'banana'`; asserts both calls resolve `null`.
- Test "a missing audience defaults to for_us": mocks `'date'`; asserts `{ kind: 'date', audience: 'for_us' }`.
- Test "a model failure is null": mocks `generate` rejecting; asserts `null`.

**Testing:**
- Test detects a gift ask for her
- Test NONE and garbage are null
- Test a missing audience defaults to for_us
- Test a model failure is null

---

## Story 4 — Idea-asks route to the suggestion engine

**Depends on:** Story 3

**Files to modify:**
- `src/lib/coach/respond.ts`
- `src/lib/coach/respond.test.ts`

**Acceptance Criteria:**
- `respond(profileId: string, userMessage: string): Promise<string>` is the SOLE export of `src/lib/coach/respond.ts` — signature unchanged.
- New imports: `detectIdeaAsk` from `'@/lib/coach/ideaAsk'` and `generateSuggestion` from `'@/lib/suggestions/generate'`. Everything else in the file stays.
- After the existing missing-profile early return and BEFORE building the coach prompt: `const ask = await detectIdeaAsk(userMessage)` inside a try/catch treating failure as `null`. When `ask` is non-null: call `generateSuggestion(profileId, ask.kind, ask.audience)`; when it returns a string, persist BOTH turns exactly as the normal path does (`role: 'user'` with `userMessage`, `role: 'assistant'` with the suggestion), still run the extraction call on the user message, and return the suggestion. When it returns `null` (or throws), fall through to the normal coach path unchanged.
- Every existing test case keeps its name and assertions; the mock set gains `vi.mock('@/lib/coach/ideaAsk', ...)` and `vi.mock('@/lib/suggestions/generate', ...)` (both I/O wrappers), with `detectIdeaAsk` resolving `null` in `beforeEach` so every existing case exercises the unchanged path.
- New test "an idea ask returns a tracked suggestion": mocks `detectIdeaAsk` resolving `{ kind: 'gift', audience: 'for_her' }` and `generateSuggestion` resolving `'a pottery wheel'`; asserts `respond('p1', 'gift ideas?')` resolves to `'a pottery wheel'`, `generateSuggestion` was called with `('p1', 'gift', 'for_her')`, and `generate` (the coach path) was not called.
- New test "a failed suggestion falls back to the coach": mocks `detectIdeaAsk` resolving an ask but `generateSuggestion` resolving `null`; asserts the result is the normal generated coach reply.

**Testing:**
- Test returns the generated reply
- Test persists both turns
- Test handles a missing profile
- Test an idea ask returns a tracked suggestion
- Test a failed suggestion falls back to the coach
