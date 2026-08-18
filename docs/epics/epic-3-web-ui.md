# Epic 3 — Web UI: visual portrait, study metrics, profile editing

The shape that ground reliably in epic 2, applied to UI work: **pure modules
compute, components render props, pages assemble.** Every metric is a pure
function taking its inputs (including `today`) as parameters. Components take
plain props and their tests mock nothing. The page is thin: it loads, computes,
and hands everything to one assembly component. The two shapes that handed off
in epic 2 — units with 3+ mocked collaborators — do not appear in this epic by
construction.

Framework notes, verified against this repo: **Next 16**, App Router. Pages are
server components unless marked `'use client'`. Route auth is already global via
`src/proxy.ts` — no story here touches auth. Component tests run under jsdom
with @testing-library/react (installed; `vitest.setup.ts` handles env).

Type facts every story must respect (from `prisma/schema.prisma` on develop):
`Mood` rows carry `label String`, `note String?`, `recordedAt DateTime`.
`Gift` rows carry `description String`, `givenAt DateTime?`. `Dream` rows carry
`description String`. `LikesEntry`/`DislikesEntry`/`Joke` rows carry `text String`.

---

## Story 1 — Gift outcome field

**Files to modify:**
- `prisma/schema.prisma`

**Acceptance Criteria:**
- The existing `Gift` model gains exactly one field: `howItLanded String?`, placed after `givenAt`.
- No other model, field, or attribute is added, removed, or reordered.
- Running `prisma generate` (no live DB required) completes without error.

**Testing:** not applicable — Prisma schema file; there is no vitest unit under test.

---

## Story 2 — Load the full portrait

**Depends on:** Story 1

**Files to create:**
- `src/lib/portrait/load.ts`
- `src/lib/portrait/load.test.ts`

**Acceptance Criteria:**
- Exports `getPortrait(profileId: string): Promise<Portrait | null>` and the type `Portrait` — these are the SOLE exports of `src/lib/portrait/load.ts`. Implement `getPortrait` exactly once; do NOT emit an alternate variant or re-export.
- Imports `prisma` from `'@/lib/db'`. No other imports.
- `Portrait` is `{ name: string; likes: string[]; dislikes: string[]; jokes: string[]; dreams: string[]; moods: { label: string; note: string | null; recordedAt: Date }[]; events: { title: string; note: string | null; occurredAt: Date }[]; gifts: { description: string; givenAt: Date | null; howItLanded: string | null }[]; trips: string[]; occasions: { label: string; month: number; day: number }[] }`.
- Fetches with a single `prisma.profile.findUnique` call: `where: { id: profileId }`, and an `include` that pulls `likes`, `dislikes`, `jokes`, `dreams`, `gifts`, `trips`, `occasions`, plus `moods` with `orderBy: { recordedAt: 'asc' }` (full history, oldest first — the timeline needs all of it) and `events` with `orderBy: { occurredAt: 'desc' }` and `take: 20`. One query, not ten.
- Returns `null` when the profile does not exist.
- Maps relations to the `Portrait` shape: `likes`, `dislikes`, `jokes` map each row to its `text`; `dreams` maps each row to its `description`; `trips` maps each row to its `destination`. `moods`, `events`, `gifts`, `occasions` keep the object fields named in the `Portrait` type and drop everything else.
- `src/lib/portrait/load.test.ts` mocks `'@/lib/db'` with `vi.mock('@/lib/db', () => ({ prisma: { profile: { findUnique: vi.fn() } } }))` — the ONLY mock in the file. Prisma-row mock values use the established idiom `vi.mocked(prisma.profile.findUnique).mockResolvedValue(row as never)` — do NOT construct full Prisma row types.
- Test "returns null for an unknown profile": mocks `findUnique` resolving `null`; asserts the result is `null`.
- Test "maps text rows to plain strings": mocks a profile with `name: 'Ada'`, `likes: [{ text: 'tea' }]`, `dreams: [{ description: 'a cabin' }]`, all other relations empty arrays; asserts `likes` equals `['tea']` and `dreams` equals `['a cabin']`.
- Test "keeps mood fields for the timeline": mocks `moods: [{ label: 'happy', note: null, recordedAt: new Date('2026-08-01T00:00:00Z') }]`; asserts the result's first mood's `label` is `'happy'` and its `recordedAt` is a `Date`.
- Test "fetches everything in one query": asserts `prisma.profile.findUnique` was called exactly once, and that the `include` passed to it requests `moods` with `orderBy: { recordedAt: 'asc' }`.

**Testing:**
- Test returns null for an unknown profile
- Test maps text rows to plain strings
- Test keeps mood fields for the timeline
- Test fetches everything in one query

---

## Story 3 — Coverage metric

**Files to create:**
- `src/lib/metrics/coverage.ts`
- `src/lib/metrics/coverage.test.ts`

**Acceptance Criteria:**
- Exports `coverage(counts: Record<string, number>): Coverage` and the type `Coverage` — these are the SOLE exports of `src/lib/metrics/coverage.ts`. Implement `coverage` exactly once; do NOT emit an alternate variant or re-export.
- Imports nothing. It is a pure function over the counts it is given — the caller supplies `{ likes: 3, dislikes: 0, ... }` however it likes.
- `Coverage` is `{ filled: number; total: number; gaps: string[] }`.
- `filled` is the number of keys whose count is greater than 0; `total` is the number of keys; `gaps` is the keys whose count is 0, in the input's key order.
- An empty input returns `{ filled: 0, total: 0, gaps: [] }`.
- `src/lib/metrics/coverage.test.ts` imports ONLY `{ coverage }` from `'./coverage'`. Does NOT use `vi.mock`.
- Test "counts filled and total": `coverage({ likes: 3, dislikes: 0, jokes: 1 })` equals `{ filled: 2, total: 3, gaps: ['dislikes'] }`.
- Test "all filled means no gaps": `coverage({ likes: 1, jokes: 2 })` has `gaps` equal to `[]`.
- Test "empty input is empty coverage": `coverage({})` equals `{ filled: 0, total: 0, gaps: [] }`.

**Testing:**
- Test counts filled and total
- Test all filled means no gaps
- Test empty input is empty coverage

---

## Story 4 — Recency metric

**Files to create:**
- `src/lib/metrics/recency.ts`
- `src/lib/metrics/recency.test.ts`

**Acceptance Criteria:**
- Exports `daysSinceLastTouch(dates: Date[], today: Date): number | null` — the SOLE export of `src/lib/metrics/recency.ts`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- Imports nothing. Takes `today` as a parameter; does NOT call `new Date()` or `Date.now()`.
- Returns the whole number of days (floor of the millisecond difference divided by 86,400,000) between `today` and the LATEST date in `dates`.
- Returns `null` when `dates` is empty — a brand-new profile has no last touch, and `0` would lie about that.
- Returns `0` when the latest date is today or in the future.
- `src/lib/metrics/recency.test.ts` imports ONLY `{ daysSinceLastTouch }` from `'./recency'`. Does NOT use `vi.mock` and does NOT use fake timers.
- Test "days since the latest date": passes `[new Date('2026-08-10T00:00:00Z'), new Date('2026-08-15T00:00:00Z')]` with today `new Date('2026-08-18T00:00:00Z')`; asserts the result is `3`.
- Test "empty history is null": `daysSinceLastTouch([], new Date('2026-08-18T00:00:00Z'))` is `null`.
- Test "a touch today is zero": passes `[new Date('2026-08-18T09:00:00Z')]` with today `new Date('2026-08-18T12:00:00Z')`; asserts the result is `0`.

**Testing:**
- Test days since the latest date
- Test empty history is null
- Test a touch today is zero

---

## Story 5 — Gift outcome stats

**Depends on:** Story 1

**Files to create:**
- `src/lib/metrics/gifts.ts`
- `src/lib/metrics/gifts.test.ts`

**Acceptance Criteria:**
- Exports `giftStats(gifts: { howItLanded: string | null }[]): GiftStats` and the type `GiftStats` — these are the SOLE exports of `src/lib/metrics/gifts.ts`. Implement `giftStats` exactly once; do NOT emit an alternate variant or re-export.
- Imports nothing. It is a pure function.
- `GiftStats` is `{ logged: number; hits: number; misses: number; unrated: number; successRate: number | null }`.
- `hits` counts gifts whose `howItLanded` is exactly `'hit'`; `misses` counts exactly `'miss'`; everything else (including `null` and unknown strings) is `unrated`.
- `successRate` is `hits / (hits + misses)` — rated gifts only — or `null` when no gift is rated. Never divide by zero.
- `src/lib/metrics/gifts.test.ts` imports ONLY `{ giftStats }` from `'./gifts'`. Does NOT use `vi.mock`.
- Test "counts hits misses and unrated": passes `[{ howItLanded: 'hit' }, { howItLanded: 'hit' }, { howItLanded: 'miss' }, { howItLanded: null }]`; asserts `{ logged: 4, hits: 2, misses: 1, unrated: 1, successRate: 2 / 3 }`.
- Test "no rated gifts means null success rate": passes `[{ howItLanded: null }]`; asserts `successRate` is `null` and `unrated` is `1`.
- Test "empty list is all zeros": passes `[]`; asserts `{ logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }`.

**Testing:**
- Test counts hits misses and unrated
- Test no rated gifts means null success rate
- Test empty list is all zeros

---

## Story 6 — Mood timeline buckets

**Files to create:**
- `src/lib/metrics/moodBuckets.ts`
- `src/lib/metrics/moodBuckets.test.ts`

**Acceptance Criteria:**
- Exports `moodBuckets(moods: { label: string; recordedAt: Date }[]): MoodBucket[]` and the type `MoodBucket` — these are the SOLE exports of `src/lib/metrics/moodBuckets.ts`. Implement `moodBuckets` exactly once; do NOT emit an alternate variant or re-export.
- Imports nothing. Takes no `today` and reads no clock — it buckets whatever it is given.
- `MoodBucket` is `{ day: string; labels: string[] }`, where `day` is the UTC calendar date formatted exactly `YYYY-MM-DD` (from `recordedAt.toISOString().slice(0, 10)`).
- Groups moods by `day`; within a bucket, `labels` keeps the input order. Buckets are sorted by `day` ascending.
- An empty input returns `[]`.
- `src/lib/metrics/moodBuckets.test.ts` imports ONLY `{ moodBuckets }` from `'./moodBuckets'`. Does NOT use `vi.mock` and does NOT use fake timers.
- Test "groups same-day moods into one bucket": passes two moods on `2026-08-17` (different times) and one on `2026-08-18`; asserts the result has length 2 and the first bucket's `labels` has length 2.
- Test "buckets are sorted by day ascending": passes the `2026-08-18` mood BEFORE the `2026-08-17` moods in the input; asserts `result[0].day` is `'2026-08-17'`.
- Test "empty input is an empty array": `moodBuckets([])` equals `[]`.

**Testing:**
- Test groups same-day moods into one bucket
- Test buckets are sorted by day ascending
- Test empty input is an empty array

---

## Story 7 — Portrait list section component

**Files to create:**
- `src/components/PortraitSection.tsx`
- `src/components/PortraitSection.test.tsx`

**Acceptance Criteria:**
- Default-exports a component named `PortraitSection` — the SOLE export of `src/components/PortraitSection.tsx`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- Props: `{ title: string; items: string[] }`. Imports nothing except React (JSX only — no hooks, no `'use client'`; it is a server-renderable presentational component).
- Renders the `title` in a heading element and each item as an `<li>` inside a `<ul>`.
- When `items` is empty, renders the title and, instead of a list, a paragraph containing the exact text `Nothing here yet.` — an empty portrait section invites filling in, it does not vanish.
- The root element carries `data-testid="portrait-section"`.
- `src/components/PortraitSection.test.tsx` imports `{ render, screen }` from `'@testing-library/react'` and `PortraitSection` (default) from `'./PortraitSection'`. Does NOT use `vi.mock`.
- Test "renders the title and items": renders with `title="Likes"` and `items={['tea', 'rain']}`; asserts `screen.getByText('Likes')` exists and `screen.getAllByRole('listitem')` has length 2.
- Test "empty items show the placeholder": renders with `items={[]}`; asserts `screen.getByText('Nothing here yet.')` exists and `screen.queryByRole('list')` is `null`.

**Testing:**
- Test renders the title and items
- Test empty items show the placeholder

---

## Story 8 — Mood timeline component

**Depends on:** Story 6

**Files to create:**
- `src/components/MoodTimeline.tsx`
- `src/components/MoodTimeline.test.tsx`

**Acceptance Criteria:**
- Default-exports a component named `MoodTimeline` — the SOLE export of `src/components/MoodTimeline.tsx`.
- Props: `{ buckets: MoodBucket[] }`. Imports the type `MoodBucket` from `'@/lib/metrics/moodBuckets'`. No other imports except React. No hooks, no `'use client'`.
- Renders one row per bucket: the `day` string, followed by each label in that bucket. Each row carries `data-testid="mood-day"`.
- When `buckets` is empty, renders a paragraph containing the exact text `No moods recorded yet.`
- `src/components/MoodTimeline.test.tsx` imports `{ render, screen }` from `'@testing-library/react'` and `MoodTimeline` (default) from `'./MoodTimeline'`. Does NOT use `vi.mock`.
- Test "renders one row per day": renders with two buckets; asserts `screen.getAllByTestId('mood-day')` has length 2.
- Test "shows the day and its labels": renders with `[{ day: '2026-08-17', labels: ['happy', 'tired'] }]`; asserts text `2026-08-17`, `happy`, and `tired` are each present.
- Test "empty timeline shows the placeholder": renders with `buckets={[]}`; asserts `screen.getByText('No moods recorded yet.')` exists.

**Testing:**
- Test renders one row per day
- Test shows the day and its labels
- Test empty timeline shows the placeholder

---

## Story 9 — Study metrics cards component

**Depends on:** Story 3, Story 4, Story 5

**Files to create:**
- `src/components/StudyMetrics.tsx`
- `src/components/StudyMetrics.test.tsx`

**Acceptance Criteria:**
- Default-exports a component named `StudyMetrics` — the SOLE export of `src/components/StudyMetrics.tsx`.
- Props: `{ coverage: Coverage; daysSinceTouch: number | null; gifts: GiftStats }`. Imports the type `Coverage` from `'@/lib/metrics/coverage'` and the type `GiftStats` from `'@/lib/metrics/gifts'`. No other imports except React. No hooks, no `'use client'`.
- Renders three labelled figures: coverage as the exact text `{filled} of {total} areas filled` (e.g. `7 of 10 areas filled`), recency as `Updated today` when `daysSinceTouch` is `0`, `Updated {n} days ago` when it is a positive number, and `Never updated` when it is `null`, and gifts as `{hits} of {rated} gifts landed` where `rated` is `hits + misses`, or `No gifts rated yet` when `successRate` is `null`.
- When `coverage.gaps` is non-empty, renders each gap name inside an element with `data-testid="coverage-gap"`.
- `src/components/StudyMetrics.test.tsx` imports `{ render, screen }` from `'@testing-library/react'` and `StudyMetrics` (default) from `'./StudyMetrics'`. Does NOT use `vi.mock`.
- Test "shows coverage and gaps": renders with `coverage={{ filled: 2, total: 3, gaps: ['jokes'] }}`; asserts text `2 of 3 areas filled` and one `coverage-gap` containing `jokes`.
- Test "shows recency in days": renders with `daysSinceTouch={5}`; asserts text `Updated 5 days ago`.
- Test "never updated and no rated gifts": renders with `daysSinceTouch={null}` and `gifts={{ logged: 1, hits: 0, misses: 0, unrated: 1, successRate: null }}`; asserts texts `Never updated` and `No gifts rated yet`.

**Testing:**
- Test shows coverage and gaps
- Test shows recency in days
- Test never updated and no rated gifts

---

## Story 10 — Gift history component

**Depends on:** Story 2

**Files to create:**
- `src/components/GiftHistory.tsx`
- `src/components/GiftHistory.test.tsx`

**Acceptance Criteria:**
- Default-exports a component named `GiftHistory` — the SOLE export of `src/components/GiftHistory.tsx`.
- Props: `{ gifts: { description: string; givenAt: Date | null; howItLanded: string | null }[] }` — the `Portrait['gifts']` element shape, restated here so the component does not import the loader. Imports nothing except React. No hooks, no `'use client'`.
- Renders each gift as a list item showing its `description` and an outcome badge: the exact text `landed` when `howItLanded` is `'hit'`, `missed` when `'miss'`, and `unrated` otherwise. The badge element carries `data-testid="gift-outcome"`.
- When `gifts` is empty, renders a paragraph containing the exact text `No gifts logged yet.`
- `src/components/GiftHistory.test.tsx` imports `{ render, screen }` from `'@testing-library/react'` and `GiftHistory` (default) from `'./GiftHistory'`. Does NOT use `vi.mock`.
- Test "renders each gift with its outcome": renders with a `'hit'` gift and a `null` gift; asserts two `gift-outcome` badges with texts `landed` and `unrated`.
- Test "empty history shows the placeholder": renders with `gifts={[]}`; asserts `screen.getByText('No gifts logged yet.')` exists.

**Testing:**
- Test renders each gift with its outcome
- Test empty history shows the placeholder

---

## Story 11 — Add-mood server action

**Files to create:**
- `src/app/actions/addMood.ts`
- `src/app/actions/addMood.test.ts`

**Acceptance Criteria:**
- Exports `addMood(profileId: string, label: string, note: string | null): Promise<{ ok: boolean }>` — the SOLE export of `src/app/actions/addMood.ts`. The file's first line is the directive `'use server'`.
- Imports `prisma` from `'@/lib/db'` and `revalidatePath` from `'next/cache'`. No other imports.
- Returns `{ ok: false }` without any database call when `label` (trimmed) is empty.
- Otherwise calls `prisma.mood.create` exactly once with `data: { profileId, label: <trimmed label>, note }`, then `revalidatePath('/portrait')`, then returns `{ ok: true }`. Does NOT pass `recordedAt` — the schema default supplies it.
- `src/app/actions/addMood.test.ts` mocks `'@/lib/db'` with `vi.mock('@/lib/db', () => ({ prisma: { mood: { create: vi.fn() } } }))` and `'next/cache'` with `vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))`. Prisma mock resolutions use `as never`.
- Test "creates the mood and revalidates": calls `addMood('p1', 'happy', null)`; asserts the result is `{ ok: true }`, `prisma.mood.create` was called with `data: { profileId: 'p1', label: 'happy', note: null }`, and `revalidatePath` was called with `'/portrait'`.
- Test "empty label is rejected without a db call": calls `addMood('p1', '   ', null)`; asserts `{ ok: false }` and that `prisma.mood.create` was not called.
- Test "label is trimmed": calls `addMood('p1', '  calm ', 'after dinner')`; asserts `create` received `label: 'calm'` and `note: 'after dinner'`.

**Testing:**
- Test creates the mood and revalidates
- Test empty label is rejected without a db call
- Test label is trimmed

---

## Story 12 — Add-entry server action

**Files to create:**
- `src/app/actions/addEntry.ts`
- `src/app/actions/addEntry.test.ts`

**Acceptance Criteria:**
- Exports `addEntry(profileId: string, field: EntryField, text: string): Promise<{ ok: boolean }>` and the type `EntryField` — these are the SOLE exports of `src/app/actions/addEntry.ts`. The file's first line is the directive `'use server'`.
- `EntryField` is `'likes' | 'dislikes' | 'jokes' | 'dreams'`.
- Imports `prisma` from `'@/lib/db'` and `revalidatePath` from `'next/cache'`. No other imports.
- Returns `{ ok: false }` without any database call when `text` (trimmed) is empty or `field` is not one of the four allowed values.
- Dispatches on `field` to exactly one create call: `likes` → `prisma.likesEntry.create` with `data: { profileId, text }`; `dislikes` → `prisma.dislikesEntry.create` with `data: { profileId, text }`; `jokes` → `prisma.joke.create` with `data: { profileId, text }`; `dreams` → `prisma.dream.create` with `data: { profileId, description: text }` — note the dreams field is `description`, NOT `text`; the trimmed input is used in all four.
- Then `revalidatePath('/portrait')` and returns `{ ok: true }`.
- `src/app/actions/addEntry.test.ts` mocks `'@/lib/db'` with `vi.mock('@/lib/db', () => ({ prisma: { likesEntry: { create: vi.fn() }, dislikesEntry: { create: vi.fn() }, joke: { create: vi.fn() }, dream: { create: vi.fn() } } }))` and `'next/cache'` with `vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))`.
- Test "creates a like": calls `addEntry('p1', 'likes', 'tea')`; asserts `{ ok: true }` and `prisma.likesEntry.create` called with `data: { profileId: 'p1', text: 'tea' }`.
- Test "a dream stores description": calls `addEntry('p1', 'dreams', 'a cabin')`; asserts `prisma.dream.create` called with `data: { profileId: 'p1', description: 'a cabin' }` and that `prisma.likesEntry.create` was not called.
- Test "unknown field is rejected": calls `addEntry('p1', 'moods' as never, 'x')`; asserts `{ ok: false }` and no create was called.
- Test "empty text is rejected": calls `addEntry('p1', 'likes', '  ')`; asserts `{ ok: false }` and no create was called.

**Testing:**
- Test creates a like
- Test a dream stores description
- Test unknown field is rejected
- Test empty text is rejected

---

## Story 13 — Mood entry form component

**Depends on:** Story 11

**Files to create:**
- `src/components/MoodForm.tsx`
- `src/components/MoodForm.test.tsx`

**Acceptance Criteria:**
- Default-exports a component named `MoodForm` — the SOLE export of `src/components/MoodForm.tsx`. The file's first line is the directive `'use client'`.
- Props: `{ profileId: string }`. Imports `addMood` from `'@/app/actions/addMood'` and `useState` from `'react'`. No other imports.
- Renders a text input labelled `Mood` (an accessible label association — `<label>` with `htmlFor` or wrapping), a text input labelled `Note`, and a button with the exact accessible name `Add mood`.
- On submit, calls `addMood(profileId, label, note || null)` and clears both inputs when the result's `ok` is `true`; when `ok` is `false`, leaves the inputs as they are.
- `src/components/MoodForm.test.tsx` mocks `'@/app/actions/addMood'` with `vi.mock('@/app/actions/addMood', () => ({ addMood: vi.fn() }))` — a server action is I/O and this is the file's ONLY mock. Imports `{ render, screen }` from `'@testing-library/react'` and `userEvent` (default) from `'@testing-library/user-event'`.
- Test "submits the typed mood": mocks `addMood` resolving `{ ok: true }`; types `happy` into `Mood`, clicks `Add mood`; asserts `addMood` was called with `('p1', 'happy', null)`.
- Test "clears the input after a successful add": same flow; asserts the `Mood` input's value is `''` afterwards.
- Test "keeps the input when the action rejects it": mocks `addMood` resolving `{ ok: false }`; types `x`, submits; asserts the `Mood` input still has value `'x'`.

**Testing:**
- Test submits the typed mood
- Test clears the input after a successful add
- Test keeps the input when the action rejects it

---

## Story 14 — Entry form component

**Depends on:** Story 12

**Files to create:**
- `src/components/EntryForm.tsx`
- `src/components/EntryForm.test.tsx`

**Acceptance Criteria:**
- Default-exports a component named `EntryForm` — the SOLE export of `src/components/EntryForm.tsx`. The file's first line is the directive `'use client'`.
- Props: `{ profileId: string }`. Imports `addEntry` and the type `EntryField` from `'@/app/actions/addEntry'` and `useState` from `'react'`. No other imports.
- Renders a `<select>` labelled `Add to` with exactly four options whose values are `likes`, `dislikes`, `jokes`, `dreams` (in that order), a text input labelled `Entry`, and a button with the exact accessible name `Add entry`.
- On submit, calls `addEntry(profileId, field, text)` with the selected field and typed text, and clears the text input when the result's `ok` is `true`.
- `src/components/EntryForm.test.tsx` mocks `'@/app/actions/addEntry'` with `vi.mock('@/app/actions/addEntry', () => ({ addEntry: vi.fn() }))` — the file's ONLY mock. Imports `{ render, screen }` from `'@testing-library/react'` and `userEvent` (default) from `'@testing-library/user-event'`.
- Test "submits to the selected field": mocks `addEntry` resolving `{ ok: true }`; selects `dreams`, types `a cabin`, clicks `Add entry`; asserts `addEntry` was called with `('p1', 'dreams', 'a cabin')`.
- Test "defaults to likes": types `tea` and submits without touching the select; asserts `addEntry` was called with `('p1', 'likes', 'tea')`.
- Test "clears the entry after success": asserts the `Entry` input's value is `''` after a successful submit.

**Testing:**
- Test submits to the selected field
- Test defaults to likes
- Test clears the entry after success

---

## Story 15 — Portrait view assembly

**Depends on:** Story 7, Story 8, Story 9, Story 10, Story 13, Story 14

**Files to create:**
- `src/components/PortraitView.tsx`
- `src/components/PortraitView.test.tsx`

**Acceptance Criteria:**
- Default-exports a component named `PortraitView` — the SOLE export of `src/components/PortraitView.tsx`.
- Props: `{ portrait: Portrait; profileId: string; coverage: Coverage; daysSinceTouch: number | null; giftStats: GiftStats; buckets: MoodBucket[] }`. Imports the types from their modules (`Portrait` from `'@/lib/portrait/load'`, `Coverage` from `'@/lib/metrics/coverage'`, `GiftStats` from `'@/lib/metrics/gifts'`, `MoodBucket` from `'@/lib/metrics/moodBuckets'`) and the components `PortraitSection`, `MoodTimeline`, `StudyMetrics`, `GiftHistory`, `MoodForm`, `EntryForm` (all default imports from `'@/components/...'`). No hooks, no `'use client'` — the client boundary lives in the two form components.
- Renders, in order: a heading containing `portrait.name`; `StudyMetrics`; a `PortraitSection` for each of Likes (`portrait.likes`), Dislikes (`portrait.dislikes`), Jokes (`portrait.jokes`), Dreams & wishes (`portrait.dreams`), Trips (`portrait.trips`); `GiftHistory` with `portrait.gifts`; `MoodTimeline` with `buckets`; `MoodForm` and `EntryForm` with `profileId`.
- It is glue: it computes nothing and fetches nothing — every value renders from props.
- `src/components/PortraitView.test.tsx` imports `{ render, screen }` from `'@testing-library/react'` and `PortraitView` (default). Does NOT use `vi.mock` — every child is a pure local component and the forms only call their actions on interaction, which these tests do not perform.
- The test file declares one fixture portrait: `const portrait: Portrait = { name: 'Ada', likes: ['tea'], dislikes: [], jokes: [], dreams: [], moods: [], events: [], gifts: [], trips: [], occasions: [] }` and spreads it where variation is needed.
- Test "renders the name and all sections": renders with the fixture and empty metrics (`coverage={{ filled: 1, total: 5, gaps: [] }}`, `daysSinceTouch={null}`, `giftStats={{ logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }}`, `buckets={[]}`); asserts `Ada` is present and `screen.getAllByTestId('portrait-section')` has length 5.
- Test "wires the likes into their section": asserts text `tea` is present.
- Test "renders both forms": asserts buttons named `Add mood` and `Add entry` are both present.

**Testing:**
- Test renders the name and all sections
- Test wires the likes into their section
- Test renders both forms

---

## Story 16 — Portrait page

**Depends on:** Story 2, Story 15

**Files to create:**
- `src/app/portrait/page.tsx`
- `src/app/portrait/page.test.tsx`

**Acceptance Criteria:**
- Default-exports an async server component named `PortraitPage` — and exports `const dynamic = 'force-dynamic'`. These are the SOLE exports of `src/app/portrait/page.tsx`.
- Imports `getPortrait` from `'@/lib/portrait/load'`, `coverage` from `'@/lib/metrics/coverage'`, `daysSinceLastTouch` from `'@/lib/metrics/recency'`, `giftStats` from `'@/lib/metrics/gifts'`, `moodBuckets` from `'@/lib/metrics/moodBuckets'`, `PortraitView` (default) from `'@/components/PortraitView'`, and `prisma` from `'@/lib/db'`. No other imports.
- Resolves the profile with `prisma.profile.findFirst()` (single-user app — the first profile is the profile). When there is none, or `getPortrait` returns `null`, renders a paragraph containing the exact text `No profile yet — start the questionnaire in Telegram.`
- Otherwise computes: `coverage` from the portrait's list lengths under the keys `likes`, `dislikes`, `jokes`, `dreams`, `moods`, `events`, `gifts`, `trips` (in that order); `daysSinceLastTouch` over the mood `recordedAt`s and event `occurredAt`s combined, with `new Date()` as today — the page is the I/O shell, so the clock read belongs HERE, not in the metric; `giftStats` over the portrait's gifts; `moodBuckets` over the portrait's moods. Renders `PortraitView` with all of it.
- `src/app/portrait/page.test.tsx` mocks `'@/lib/db'` with `vi.mock('@/lib/db', () => ({ prisma: { profile: { findFirst: vi.fn() } } }))` and `'@/lib/portrait/load'` with `vi.mock('@/lib/portrait/load', () => ({ getPortrait: vi.fn() }))` — both are I/O; the metrics and view are pure local modules and are NOT mocked. Renders the page by awaiting it: `render(await PortraitPage())`.
- Test "renders the empty state without a profile": mocks `findFirst` resolving `null`; asserts the exact empty-state text is present and `getPortrait` was not called.
- Test "renders the portrait for the first profile": mocks `findFirst` resolving `{ id: 'p1' }` and `getPortrait` resolving a minimal portrait (`name: 'Ada'`, all arrays empty); asserts `getPortrait` was called with `'p1'` and text `Ada` is present.
- Test "computes coverage from the portrait": same mocks but `likes: ['tea']`; asserts text `1 of 8 areas filled` is present.

**Testing:**
- Test renders the empty state without a profile
- Test renders the portrait for the first profile
- Test computes coverage from the portrait

---

## Story 17 — Home page routes to the portrait

**Depends on:** Story 16

**Files to modify:**
- `src/app/page.tsx`

**Acceptance Criteria:**
- Replaces the scaffold home page entirely: the new `src/app/page.tsx` imports `redirect` from `'next/navigation'` and default-exports a component named `Home` that calls `redirect('/portrait')`.
- These are the SOLE contents: no JSX, no other imports, no other exports. The scaffold's `next/image` logo markup is deleted.

**Testing:** not applicable — a one-line redirect with no branching; the portrait page's own tests cover the destination.
