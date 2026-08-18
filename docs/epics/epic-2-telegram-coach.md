# Epic 2 — Telegram coach: webhook, questionnaire, conversation loop, cadences

Every module here is a plain `.ts` unit with a declared export and declared
imports. The two route handlers are deliberately thin: they parse, delegate,
and respond, so the logic worth testing lives in modules that need no HTTP.

Framework note, verified against this repo: it runs **Next 16**. Route handlers
live at `src/app/api/<name>/route.ts` and export named HTTP verbs (`POST`,
`GET`). Do not use the Pages-router `export default function handler` shape.

---

## Story 1 — Telegram and cadence domain models

**Files to modify:**
- `prisma/schema.prisma`

**Acceptance Criteria:**
- `prisma/schema.prisma` gains exactly five models appended after the existing `Suggestion` model: `TelegramChat`, `Message`, `QuestionnaireAnswer`, `Occasion`, `CadenceRun`.
- `TelegramChat` fields: `id String @id @default(cuid())`, `chatId String @unique`, `profileId String`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `Message` fields: `id String @id @default(cuid())`, `profileId String`, `role String`, `text String`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `QuestionnaireAnswer` fields: `id String @id @default(cuid())`, `profileId String`, `questionId String`, `answer String`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`. Add `@@unique([profileId, questionId])`.
- `Occasion` fields: `id String @id @default(cuid())`, `profileId String`, `kind String`, `label String`, `month Int`, `day Int`, `leadTimeDays Int @default(7)`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`. Store month and day rather than a full date, because birthdays and anniversaries recur every year.
- `CadenceRun` fields: `id String @id @default(cuid())`, `profileId String`, `kind String`, `ranOn DateTime`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`. Add `@@unique([profileId, kind, ranOn])` so a re-run of the same cron day cannot double-send.
- The existing `Profile` model gains these inverse arrays: `telegramChats TelegramChat[]`, `messages Message[]`, `questionnaireAnswers QuestionnaireAnswer[]`, `occasions Occasion[]`, `cadenceRuns CadenceRun[]`.
- The existing `Suggestion` model gains one field: `kind String @default("date")`. Do NOT otherwise modify `Suggestion` or any other existing model.
- Running `prisma generate` (no live DB required) completes without error.

**Testing:** not applicable — Prisma schema file; there is no vitest unit under test.

---

## Story 2 — Telegram webhook secret verification

**Files to create:**
- `src/lib/telegram/verify.ts`
- `src/lib/telegram/verify.test.ts`

**Acceptance Criteria:**
- Exports `verifyTelegramSecret(headerValue: string | null, secret: string | undefined): boolean` — the SOLE export of `src/lib/telegram/verify.ts`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- Imports `timingSafeEqual` from `'node:crypto'`. No other imports.
- Telegram authenticates its webhook by echoing the `secret_token` given to `setWebhook` in the `X-Telegram-Bot-Api-Secret-Token` request header. This function compares that header against the configured secret.
- Returns `false` when `secret` is undefined or empty — an unconfigured server must reject every request rather than accept every request.
- Returns `false` when `headerValue` is null.
- Returns `false` when the two strings differ in length, without calling `timingSafeEqual` (it throws on length mismatch).
- Otherwise returns the result of a `timingSafeEqual` comparison over `Buffer.from(...)` of both strings.
- `src/lib/telegram/verify.test.ts` imports ONLY `{ verifyTelegramSecret }` from `'./verify'`. Does NOT use `vi.mock`.
- Test "matching secret is accepted": `expect(verifyTelegramSecret('s3cret', 's3cret')).toBe(true)`.
- Test "different secret is rejected": `expect(verifyTelegramSecret('wrong', 's3cret')).toBe(false)`.
- Test "different length is rejected without throwing": `expect(verifyTelegramSecret('short', 'muchlongersecret')).toBe(false)`.
- Test "null header is rejected": `expect(verifyTelegramSecret(null, 's3cret')).toBe(false)`.
- Test "unconfigured secret rejects everything": `expect(verifyTelegramSecret('anything', undefined)).toBe(false)` and `expect(verifyTelegramSecret('', '')).toBe(false)`.

**Testing:**
- Test matching secret is accepted
- Test different secret is rejected
- Test different length is rejected without throwing
- Test null header is rejected
- Test unconfigured secret rejects everything

---

## Story 3 — Parse a Telegram update

**Files to create:**
- `src/lib/telegram/parse.ts`
- `src/lib/telegram/parse.test.ts`

**Acceptance Criteria:**
- Exports `parseUpdate(update: unknown): IncomingMessage | null` and the type `IncomingMessage` — these are the SOLE exports of `src/lib/telegram/parse.ts`. Implement `parseUpdate` exactly once; do NOT emit an alternate variant or re-export.
- `IncomingMessage` is `{ chatId: string; text: string }`.
- Imports nothing. It is a pure function over a plain object.
- Reads `update.message.chat.id` and `update.message.text`, returning `{ chatId: String(id), text }`.
- Returns `null` for any update that is not a text message — a missing `message`, a missing `text` (photos, stickers, joins), or a missing `chat.id`. Telegram sends many update kinds to the same webhook and the coach only handles text.
- Does not throw on malformed input: `parseUpdate(null)`, `parseUpdate({})` and `parseUpdate('nonsense')` all return `null`.
- `src/lib/telegram/parse.test.ts` imports ONLY `{ parseUpdate }` from `'./parse'`. Does NOT use `vi.mock`.
- Test "extracts chat id and text": `parseUpdate({ message: { chat: { id: 4242 }, text: 'hello' } })` equals `{ chatId: '4242', text: 'hello' }`.
- Test "numeric chat id becomes a string": asserts the returned `chatId` is `'4242'`, strictly equal, not the number.
- Test "non-text message returns null": `parseUpdate({ message: { chat: { id: 1 }, photo: [] } })` is `null`.
- Test "malformed input returns null": `parseUpdate(null)`, `parseUpdate({})`, and `parseUpdate('nonsense')` are each `null`.

**Testing:**
- Test extracts chat id and text
- Test numeric chat id becomes a string
- Test non-text message returns null
- Test malformed input returns null

---

## Story 4 — Send a Telegram message

**Files to create:**
- `src/lib/telegram/send.ts`
- `src/lib/telegram/send.test.ts`

**Acceptance Criteria:**
- Exports `sendMessage(chatId: string, text: string): Promise<void>` — the SOLE export of `src/lib/telegram/send.ts`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- Imports nothing except Node.js globals (`fetch`, `process`). No npm package imports, no Prisma, no Telegram SDK.
- POSTs to `` `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage` `` with header `{ 'Content-Type': 'application/json' }` and body `JSON.stringify({ chat_id: chatId, text })`.
- Throws an `Error` when `!res.ok`, with a message containing `'Telegram API error'`.
- Throws an `Error` when `process.env.TELEGRAM_BOT_TOKEN` is unset, before calling fetch. A request to a URL containing the literal string `undefined` would otherwise fail confusingly.
- `src/lib/telegram/send.test.ts` imports ONLY `{ sendMessage }` from `'./send'`. Mocks global fetch with `vi.stubGlobal('fetch', vi.fn())`. Sets `process.env.TELEGRAM_BOT_TOKEN` in the tests that need it.
- Test "posts to the sendMessage endpoint": sets the token to `'tok'`; mocks fetch resolving `{ ok: true }`; calls `sendMessage('42', 'hi')`; asserts fetch's first argument contains `'/bottok/sendMessage'`.
- Test "sends chat id and text as JSON": asserts the request body parses to `{ chat_id: '42', text: 'hi' }`.
- Test "throws on non-ok response": mocks fetch resolving `{ ok: false, statusText: 'Bad Request' }`; asserts `sendMessage('42', 'hi')` rejects.
- Test "throws when the bot token is unset": deletes `process.env.TELEGRAM_BOT_TOKEN`; asserts `sendMessage('42', 'hi')` rejects and that fetch was not called.

**Testing:**
- Test posts to the sendMessage endpoint
- Test sends chat id and text as JSON
- Test throws on non-ok response
- Test throws when the bot token is unset

---

## Story 5 — The questionnaire question set

**Files to create:**
- `src/lib/questionnaire/questions.ts`
- `src/lib/questionnaire/questions.test.ts`

**Acceptance Criteria:**
- Exports the constant `QUESTIONS` and the type `Question` — these are the SOLE exports of `src/lib/questionnaire/questions.ts`. Define `QUESTIONS` exactly once; do NOT emit an alternate variant or re-export.
- Imports nothing. It is a static data module.
- `Question` is `{ id: string; prompt: string; field: string }`, where `field` names the domain model an answer feeds: one of `'likes'`, `'dislikes'`, `'jokes'`, `'moods'`, `'dreams'`, `'events'`, `'gifts'`, `'trips'`.
- `QUESTIONS` is a readonly array of exactly 12 questions, declared `as const satisfies readonly Question[]`.
- Every `id` is unique and kebab-case. Ids are stored in the database, so they must be stable.
- The 12 questions cover, in this order: `favourite-things` (likes), `small-joys` (likes), `pet-peeves` (dislikes), `stress-signals` (moods), `comfort-response` (moods), `running-joke` (jokes), `best-gift` (gifts), `gift-misses` (gifts), `dream-trip` (trips), `someday-dream` (dreams), `proudest-moment` (events), `hard-year` (events).
- Each `prompt` is a full question addressed to the user about their partner, ending in a question mark.
- `src/lib/questionnaire/questions.test.ts` imports ONLY `{ QUESTIONS }` from `'./questions'`. Does NOT use `vi.mock`.
- Test "has twelve questions": `expect(QUESTIONS).toHaveLength(12)`.
- Test "every id is unique": builds a `Set` of ids and asserts its size equals `QUESTIONS.length`.
- Test "every question has a prompt ending in a question mark": asserts every `prompt` is a non-empty string ending with `'?'`.
- Test "every field is a known domain field": asserts every `field` is a member of the eight allowed strings.

**Testing:**
- Test has twelve questions
- Test every id is unique
- Test every question has a prompt ending in a question mark
- Test every field is a known domain field

---

## Story 6 — Questionnaire progress

**Depends on:** Story 5

**Files to create:**
- `src/lib/questionnaire/flow.ts`
- `src/lib/questionnaire/flow.test.ts`

**Acceptance Criteria:**
- Exports `nextQuestion(answeredIds: string[]): Question | null` — the SOLE export of `src/lib/questionnaire/flow.ts`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- Imports `QUESTIONS` and the type `Question` from `'@/lib/questionnaire/questions'`. No other imports.
- Returns the first question in `QUESTIONS` whose `id` is not in `answeredIds`.
- Returns `null` when every question has been answered — that is the signal the questionnaire is complete and the daily conversation can begin.
- Ignores unknown ids in `answeredIds` rather than throwing, so a renamed question cannot wedge a profile.
- Is a pure function: it does not read the database. The caller supplies the answered ids.
- `src/lib/questionnaire/flow.test.ts` imports ONLY `{ nextQuestion }` from `'./flow'` and `{ QUESTIONS }` from `'@/lib/questionnaire/questions'`. Does NOT use `vi.mock`.
- Test "returns the first question when nothing is answered": `expect(nextQuestion([])).toEqual(QUESTIONS[0])`.
- Test "skips answered questions": passes `[QUESTIONS[0].id]` and asserts the result equals `QUESTIONS[1]`.
- Test "returns null when all are answered": passes every id and asserts the result is `null`.
- Test "unknown ids are ignored": passes `['no-such-question']` and asserts the result equals `QUESTIONS[0]`.

**Testing:**
- Test returns the first question when nothing is answered
- Test skips answered questions
- Test returns null when all are answered
- Test unknown ids are ignored

---

## Story 7 — Structured profile retrieval

**Depends on:** Story 1

**Files to create:**
- `src/lib/profile/context.ts`
- `src/lib/profile/context.test.ts`

**Acceptance Criteria:**
- Exports `getProfileContext(profileId: string): Promise<ProfileContext | null>` and the type `ProfileContext` — these are the SOLE exports of `src/lib/profile/context.ts`. Implement `getProfileContext` exactly once; do NOT emit an alternate variant or re-export.
- Imports `prisma` from `'@/lib/db'`. No other imports.
- `ProfileContext` is `{ name: string; likes: string[]; dislikes: string[]; jokes: string[]; dreams: string[]; recentMoods: { label: string; note: string | null }[]; recentEvents: { title: string; note: string | null }[]; pastGifts: string[]; pastTrips: string[] }`.
- Fetches with a single `prisma.profile.findUnique` call: `where: { id: profileId }`, and an `include` that pulls `likes`, `dislikes`, `jokes`, `dreams`, `gifts`, `trips`, plus `moods` and `events` each with `orderBy` newest-first and `take: 10`. One query, not nine — this runs on every inbound message.
- Returns `null` when the profile does not exist.
- Maps each relation to its plain string or object form as typed above; `likes`, `dislikes` and `jokes` map to their `text`, `dreams` and `gifts` to their `description`, `trips` to their `destination`.
- This is structured retrieval by entity type. It does NOT use embeddings, vector search, or a similarity index.
- `src/lib/profile/context.test.ts` mocks `'@/lib/db'` with `vi.mock('@/lib/db', () => ({ prisma: { profile: { findUnique: vi.fn() } } }))`. Imports `{ getProfileContext }` from `'./context'` and `{ prisma }` from `'@/lib/db'`.
- Test "returns null for an unknown profile": mocks `findUnique` resolving `null`; asserts the result is `null`.
- Test "maps relations to plain strings": mocks `findUnique` resolving a profile with `name: 'Ada'`, `likes: [{ text: 'tea' }]`, `trips: [{ destination: 'Kyoto' }]`; asserts the result's `name` is `'Ada'`, `likes` equals `['tea']`, and `pastTrips` equals `['Kyoto']`.
- Test "fetches everything in one query": asserts `prisma.profile.findUnique` was called exactly once.
- Test "limits moods and events to ten, newest first": asserts the `include` passed to `findUnique` requests `take: 10` for both `moods` and `events`.

**Testing:**
- Test returns null for an unknown profile
- Test maps relations to plain strings
- Test fetches everything in one query
- Test limits moods and events to ten, newest first

---

## Story 8 — Build the coach prompt

**Depends on:** Story 7

**Files to create:**
- `src/lib/coach/prompt.ts`
- `src/lib/coach/prompt.test.ts`

**Acceptance Criteria:**
- Exports `buildCoachPrompt(context: ProfileContext, history: { role: string; text: string }[], userMessage: string): string` — the SOLE export of `src/lib/coach/prompt.ts`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- Imports the type `ProfileContext` from `'@/lib/profile/context'`. No other imports.
- Is a pure function: it builds and returns a string. It does not call the AI module, and it does not read the database.
- The returned prompt opens with a role instruction naming the coach's job: helping the user understand and delight their partner, using only what the profile records.
- Includes the partner's name and each non-empty section of the context under a plain labelled heading (`Likes:`, `Dislikes:`, `Jokes:`, `Dreams:`, `Recent moods:`, `Recent events:`, `Past gifts:`, `Past trips:`).
- Omits a section entirely when its array is empty, rather than printing an empty heading — a new profile would otherwise be mostly blank labels.
- Appends the conversation `history` in order, each line prefixed by its role, then the `userMessage` last.
- Includes an instruction not to invent facts about the partner that are absent from the context.
- `src/lib/coach/prompt.test.ts` imports ONLY `{ buildCoachPrompt }` from `'./prompt'`. Does NOT use `vi.mock`.
- Test "includes the partner name": builds with a context whose `name` is `'Ada'`; asserts the result contains `'Ada'`.
- Test "includes populated sections": builds with `likes: ['tea']`; asserts the result contains `'Likes:'` and `'tea'`.
- Test "omits empty sections": builds with `dislikes: []`; asserts the result does NOT contain `'Dislikes:'`.
- Test "ends with the user message": builds with the user message `'what should I plan?'`; asserts the result ends with a string containing `'what should I plan?'`.
- Test "includes history in order": builds with history `[{ role: 'user', text: 'first' }, { role: 'assistant', text: 'second' }]`; asserts `indexOf('first')` is less than `indexOf('second')`.

**Testing:**
- Test includes the partner name
- Test includes populated sections
- Test omits empty sections
- Test ends with the user message
- Test includes history in order

---

## Story 9 — The conversation loop

**Depends on:** Story 8

**Files to create:**
- `src/lib/coach/respond.ts`
- `src/lib/coach/respond.test.ts`

**Acceptance Criteria:**
- Exports `respond(profileId: string, userMessage: string): Promise<string>` — the SOLE export of `src/lib/coach/respond.ts`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- Imports `prisma` from `'@/lib/db'`, `generate` from `'@/lib/ai'`, `getProfileContext` from `'@/lib/profile/context'`, and `buildCoachPrompt` from `'@/lib/coach/prompt'`. No other imports.
- Loads the profile context, loads the last 20 `Message` rows for the profile ordered newest-first via `prisma.message.findMany`, reverses them into chronological order, builds the prompt, and calls `generate`.
- Persists both sides of the exchange with `prisma.message.create`: the inbound message with `role: 'user'`, then the reply with `role: 'assistant'`.
- Returns the generated reply text.
- Returns the string `'I do not have a profile set up yet.'` when `getProfileContext` resolves `null`, without calling `generate`.
- `src/lib/coach/respond.test.ts` mocks `'@/lib/db'`, `'@/lib/ai'`, and `'@/lib/profile/context'` with `vi.mock`. It does NOT mock `'@/lib/coach/prompt'` — that module is pure local code, and mocking it would make the test pass regardless of what the prompt builder does.
- Test "returns the generated reply": mocks context resolving a profile and `generate` resolving `'a thoughtful reply'`; asserts `respond('p1', 'hi')` resolves to `'a thoughtful reply'`.
- Test "persists both turns": asserts `prisma.message.create` was called twice, once with `role: 'user'` and once with `role: 'assistant'`.
- Test "handles a missing profile": mocks context resolving `null`; asserts the returned string contains `'profile'` and that `generate` was not called.
- Test "passes recent history to the prompt": mocks `findMany` resolving two messages; asserts `generate` was called once with a string containing both message texts.

**Testing:**
- Test returns the generated reply
- Test persists both turns
- Test handles a missing profile
- Test passes recent history to the prompt

---

## Story 10 — Audience-tagged suggestions

**Depends on:** Story 7

**Files to create:**
- `src/lib/suggestions/generate.ts`
- `src/lib/suggestions/generate.test.ts`

**Acceptance Criteria:**
- Exports `generateSuggestion(profileId: string, kind: SuggestionKind, audience: Audience): Promise<string | null>` and the types `SuggestionKind` and `Audience` — these are the SOLE exports of `src/lib/suggestions/generate.ts`. Implement `generateSuggestion` exactly once; do NOT emit an alternate variant or re-export.
- `SuggestionKind` is `'date' | 'gift' | 'trip'`. `Audience` is `'for_her' | 'for_us' | 'for_family'`.
- Imports `prisma` from `'@/lib/db'`, `generate` from `'@/lib/ai'`, and `getProfileContext` from `'@/lib/profile/context'`. No other imports.
- Loads the profile context and the profile's existing `Suggestion` rows via `prisma.suggestion.findMany`, then asks `generate` for one new suggestion of the given kind for the given audience.
- The prompt lists the existing suggestion bodies and instructs the model not to repeat them. Suggestion history exists so the coach does not propose the same dinner every week.
- Persists the result with `prisma.suggestion.create`, storing `body`, `kind`, `audience`, and `profileId`.
- Returns the suggestion body, or `null` when the profile does not exist — without calling `generate` or `create`.
- `src/lib/suggestions/generate.test.ts` mocks `'@/lib/db'`, `'@/lib/ai'`, and `'@/lib/profile/context'` with `vi.mock`.
- Test "returns and persists a suggestion": mocks context resolving a profile and `generate` resolving `'a picnic'`; asserts the return is `'a picnic'` and that `prisma.suggestion.create` was called once.
- Test "stores the kind and audience": asserts the object passed to `create` carries `kind: 'gift'` and `audience: 'for_her'`.
- Test "tells the model not to repeat past suggestions": mocks `findMany` resolving `[{ body: 'a picnic' }]`; asserts `generate` was called with a string containing `'a picnic'`.
- Test "returns null for an unknown profile": mocks context resolving `null`; asserts the result is `null` and that `generate` was not called.

**Testing:**
- Test returns and persists a suggestion
- Test stores the kind and audience
- Test tells the model not to repeat past suggestions
- Test returns null for an unknown profile

---

## Story 11 — Which cadences are due

**Files to create:**
- `src/lib/cadence/due.ts`
- `src/lib/cadence/due.test.ts`

**Acceptance Criteria:**
- Exports `dueCadences(today: Date): CadenceKind[]` and the type `CadenceKind` — these are the SOLE exports of `src/lib/cadence/due.ts`. Implement `dueCadences` exactly once; do NOT emit an alternate variant or re-export.
- `CadenceKind` is `'daily' | 'weekly' | 'monthly'`.
- Imports nothing. It is a pure function of the date it is given.
- Takes `today` as a parameter. Does NOT call `new Date()`, `Date.now()`, or read the clock — a function that reads the clock cannot be tested for a Sunday on a Tuesday.
- Always includes `'daily'`.
- Includes `'weekly'` when `today.getUTCDay() === 0` (Sunday).
- Includes `'monthly'` when `today.getUTCDate() === 1`.
- Returns them in the order `daily`, `weekly`, `monthly`.
- All comparisons use the UTC accessors, so the result does not depend on the server's timezone.
- `src/lib/cadence/due.test.ts` imports ONLY `{ dueCadences }` from `'./due'`. Does NOT use `vi.mock` and does NOT use fake timers.
- Test "a plain weekday is daily only": `dueCadences(new Date('2026-08-18T09:00:00Z'))` equals `['daily']`.
- Test "Sunday adds weekly": `dueCadences(new Date('2026-08-23T09:00:00Z'))` equals `['daily', 'weekly']`.
- Test "the first of the month adds monthly": `dueCadences(new Date('2026-09-01T09:00:00Z'))` equals `['daily', 'monthly']`.
- Test "a Sunday the first returns all three": `dueCadences(new Date('2026-11-01T09:00:00Z'))` equals `['daily', 'weekly', 'monthly']`.

**Testing:**
- Test a plain weekday is daily only
- Test Sunday adds weekly
- Test the first of the month adds monthly
- Test a Sunday the first returns all three

---

## Story 12 — Which occasions are approaching

**Depends on:** Story 1

**Files to create:**
- `src/lib/cadence/occasions.ts`
- `src/lib/cadence/occasions.test.ts`

**Acceptance Criteria:**
- Exports `dueOccasions(occasions: OccasionInput[], today: Date): OccasionInput[]` and the type `OccasionInput` — these are the SOLE exports of `src/lib/cadence/occasions.ts`. Implement `dueOccasions` exactly once; do NOT emit an alternate variant or re-export.
- `OccasionInput` is `{ id: string; kind: string; label: string; month: number; day: number; leadTimeDays: number }`, where `month` is 1-12.
- Imports nothing. It is a pure function of the values it is given.
- Takes `today` as a parameter. Does NOT call `new Date()` or `Date.now()`.
- Returns every occasion whose next anniversary falls between `today` inclusive and `today + leadTimeDays` inclusive — the reminder should arrive with enough lead time to actually buy something.
- Computes the next occurrence in the current year, and rolls to next year when that date has already passed. A birthday on 3 January is due in late December, not eleven months away.
- Returns an empty array when nothing is approaching.
- `src/lib/cadence/occasions.test.ts` imports ONLY `{ dueOccasions }` from `'./occasions'`. Does NOT use `vi.mock` and does NOT use fake timers.
- Test "an occasion inside the lead window is due": one occasion on 20 August with `leadTimeDays: 7`, today `new Date('2026-08-17T00:00:00Z')`; asserts the result has length 1.
- Test "an occasion beyond the lead window is not due": the same occasion with today `new Date('2026-08-01T00:00:00Z')`; asserts the result is empty.
- Test "an occasion today is due": one occasion on 17 August, today `new Date('2026-08-17T00:00:00Z')`; asserts the result has length 1.
- Test "a passed occasion rolls to next year": one occasion on 3 January with `leadTimeDays: 14`, today `new Date('2026-12-27T00:00:00Z')`; asserts the result has length 1.
- Test "returns empty when nothing is approaching": passes an empty array; asserts the result equals `[]`.

**Testing:**
- Test an occasion inside the lead window is due
- Test an occasion beyond the lead window is not due
- Test an occasion today is due
- Test a passed occasion rolls to next year
- Test returns empty when nothing is approaching

---

## Story 13 — Telegram webhook route

**Depends on:** Story 9

**Files to create:**
- `src/app/api/telegram/route.ts`
- `src/app/api/telegram/route.test.ts`

**Acceptance Criteria:**
- Exports the async function `POST(request: Request): Promise<Response>` — the SOLE export of `src/app/api/telegram/route.ts`. This is the Next 16 App Router convention; do NOT write `export default function handler`.
- Imports `verifyTelegramSecret` from `'@/lib/telegram/verify'`, `parseUpdate` from `'@/lib/telegram/parse'`, `sendMessage` from `'@/lib/telegram/send'`, `respond` from `'@/lib/coach/respond'`, and `prisma` from `'@/lib/db'`. No other imports.
- Reads the `x-telegram-bot-api-secret-token` header and passes it with `process.env.TELEGRAM_WEBHOOK_SECRET` to `verifyTelegramSecret`. Returns a 401 response when it returns false, before reading the body.
- Parses the JSON body and passes it to `parseUpdate`. Returns 200 with body `{ ok: true }` when it returns `null` — Telegram retries any non-2xx, so an unhandled update kind must still be acknowledged rather than redelivered forever.
- Looks up the `TelegramChat` row by `chatId` via `prisma.telegramChat.findUnique`. When there is no such row, sends a message telling the user to link their account and returns 200.
- Otherwise calls `respond(chat.profileId, text)`, sends the reply with `sendMessage`, and returns 200 with `{ ok: true }`.
- The route is thin: it verifies, parses, delegates, and answers. It contains no prompt text and no database writes of its own.
- `src/app/api/telegram/route.test.ts` mocks `'@/lib/telegram/send'`, `'@/lib/coach/respond'`, and `'@/lib/db'` with `vi.mock`. It does NOT mock `'@/lib/telegram/verify'` or `'@/lib/telegram/parse'` — those are pure local modules, and mocking them would mean the test asserts nothing about whether unauthorised requests are actually rejected. Sets `process.env.TELEGRAM_WEBHOOK_SECRET` in tests.
- Test "rejects a request with the wrong secret": posts with a bad header; asserts the response status is 401 and that `respond` was not called.
- Test "acknowledges a non-text update": posts a valid-secret request whose body has no `message.text`; asserts the status is 200 and that `respond` was not called.
- Test "replies to a known chat": mocks `findUnique` resolving `{ profileId: 'p1' }` and `respond` resolving `'hello back'`; asserts `sendMessage` was called with the chat id and `'hello back'`.
- Test "prompts an unknown chat to link": mocks `findUnique` resolving `null`; asserts the status is 200, `respond` was not called, and `sendMessage` was called.

**Testing:**
- Test rejects a request with the wrong secret
- Test acknowledges a non-text update
- Test replies to a known chat
- Test prompts an unknown chat to link

---

## Story 14 — Cron cadence route

**Depends on:** Story 11

**Files to create:**
- `src/app/api/cron/route.ts`
- `src/app/api/cron/route.test.ts`

**Acceptance Criteria:**
- Exports the async function `GET(request: Request): Promise<Response>` — the SOLE export of `src/app/api/cron/route.ts`. Vercel Cron invokes endpoints with GET. This is the Next 16 App Router convention; do NOT write `export default function handler`.
- Imports `dueCadences` from `'@/lib/cadence/due'`, `dueOccasions` from `'@/lib/cadence/occasions'`, `respond` from `'@/lib/coach/respond'`, `sendMessage` from `'@/lib/telegram/send'`, and `prisma` from `'@/lib/db'`. No other imports.
- Returns 401 when the `authorization` header does not equal `` `Bearer ${process.env.CRON_SECRET}` ``, or when `CRON_SECRET` is unset. This endpoint would otherwise let anyone on the internet trigger messages.
- Computes `const today = new Date()` once at the top of the handler and passes it to both `dueCadences` and `dueOccasions`. The two pure modules never read the clock themselves.
- For each profile with a linked `TelegramChat`, for each due cadence kind, calls `respond` with a cadence-appropriate opener and sends the reply.
- Records each send as a `CadenceRun` row with `kind` and `ranOn` set to the UTC date, so a second invocation on the same day sends nothing. Skips any cadence whose `CadenceRun` for that profile, kind and date already exists.
- Also sends one reminder per due occasion, naming the occasion label and how many days remain.
- Returns 200 with a JSON body reporting how many messages were sent.
- `src/app/api/cron/route.test.ts` mocks `'@/lib/db'`, `'@/lib/coach/respond'`, and `'@/lib/telegram/send'` with `vi.mock`. It does NOT mock `'@/lib/cadence/due'` or `'@/lib/cadence/occasions'` — those are pure local modules. Sets `process.env.CRON_SECRET` in tests.
- Test "rejects a request without the cron secret": no authorization header; asserts the status is 401 and that `sendMessage` was not called.
- Test "sends the daily check-in": mocks one profile with a chat and no prior `CadenceRun`; asserts `sendMessage` was called at least once.
- Test "does not resend a cadence already run today": mocks a matching `CadenceRun` as already present; asserts `sendMessage` was not called for that kind.
- Test "reports the number of messages sent": asserts the JSON body carries a numeric count.

**Testing:**
- Test rejects a request without the cron secret
- Test sends the daily check-in
- Test does not resend a cadence already run today
- Test reports the number of messages sent

---

## Story 15 — Cron schedule and Telegram env variables

**Depends on:** Story 14

**Files to create:**
- `vercel.json`

**Files to modify:**
- `.env.example`

**Acceptance Criteria:**
- `vercel.json` contains a `crons` array with exactly one entry: `{ "path": "/api/cron", "schedule": "0 13 * * *" }`. One daily invocation at 13:00 UTC; the cadence module decides from the date whether that day is also weekly or monthly, so no second cron entry is needed.
- `.env.example` gains `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `CRON_SECRET`, each with an empty or placeholder value and a short comment saying what it is for.
- Does NOT add real values for any of them, and does NOT modify `.env`.

**Testing:** not applicable — configuration files; there is no vitest unit under test.
