# Epic 1 — Foundation: Prisma schema, AI module, magic-link auth

## Story 1 — Prisma schema domain models

**Files to modify:**
- `prisma/schema.prisma`

**Acceptance Criteria:**
- `prisma/schema.prisma` defines exactly these ten domain models: `Profile`, `LikesEntry`, `DislikesEntry`, `Joke`, `Mood`, `Event`, `Gift`, `Trip`, `Dream`, `Suggestion`.
- `Profile` fields: `id String @id @default(cuid())`, `name String`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`. Carries all inverse arrays: `likes LikesEntry[]`, `dislikes DislikesEntry[]`, `jokes Joke[]`, `moods Mood[]`, `events Event[]`, `gifts Gift[]`, `trips Trip[]`, `dreams Dream[]`, `suggestions Suggestion[]`.
- `LikesEntry` fields: `id String @id @default(cuid())`, `profileId String`, `text String`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `DislikesEntry` fields: `id String @id @default(cuid())`, `profileId String`, `text String`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `Joke` fields: `id String @id @default(cuid())`, `profileId String`, `text String`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `Mood` fields: `id String @id @default(cuid())`, `profileId String`, `label String`, `note String?`, `recordedAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `Event` fields: `id String @id @default(cuid())`, `profileId String`, `title String`, `occurredAt DateTime`, `note String?`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `Gift` fields: `id String @id @default(cuid())`, `profileId String`, `description String`, `givenAt DateTime?`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `Trip` fields: `id String @id @default(cuid())`, `profileId String`, `destination String`, `startDate DateTime?`, `endDate DateTime?`, `note String?`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `Dream` fields: `id String @id @default(cuid())`, `profileId String`, `description String`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- `Suggestion` fields: `id String @id @default(cuid())`, `profileId String`, `body String`, `audience String @default("private")`, `createdAt DateTime @default(now())`, `profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)`.
- Running `prisma generate` (no live DB required) completes without error.

**Testing:** not applicable — Prisma schema file; there is no vitest unit under test.

---

## Story 2 — Prisma client singleton

**Depends on:** Story 1

**Files to create:**
- `src/lib/db.ts`
- `src/lib/db.test.ts`

**Acceptance Criteria:**
- `prisma` is the SOLE export of `src/lib/db.ts`. It is a named constant of type `PrismaClient`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- `src/lib/db.ts` imports `PrismaClient` from `'@prisma/client'`. No other imports.
- The singleton guard: `const g = globalThis as unknown as { __prisma: PrismaClient | undefined }; export const prisma = g.__prisma ?? new PrismaClient(); if (process.env.NODE_ENV !== 'production') g.__prisma = prisma;`.
- `src/lib/db.test.ts` imports ONLY `{ prisma }` from `'./db'`. Also imports `{ PrismaClient }` from `'@prisma/client'`. Does NOT use `vi`/`vi.mock`.
- Test "prisma is defined": `expect(prisma).toBeDefined()`.
- Test "prisma is a PrismaClient instance": `expect(prisma).toBeInstanceOf(PrismaClient)`.

**Testing:**
- Test prisma is defined
- Test prisma is a PrismaClient instance

---

## Story 3 — AI module flexible provider

**Files to create:**
- `src/lib/ai.ts`
- `src/lib/ai.test.ts`

**Acceptance Criteria:**
- `generate(prompt: string): Promise<string>` is the SOLE export of `src/lib/ai.ts`. Implement it exactly once; do NOT emit an alternate variant or re-export.
- `src/lib/ai.ts` imports nothing except Node.js globals (`fetch`, `process`). It has no npm package imports — no Prisma, no DB singleton, no AI SDK, no provider packages.
- When `process.env.AI_PROVIDER === 'anthropic'`: posts to `'https://api.anthropic.com/v1/messages'` with headers `{ 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }`, body JSON containing `{ model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }`, throws if `!res.ok`, returns `data.content[0].text`.
- When `process.env.AI_PROVIDER` is anything else or unset (default `'ollama'`): posts to `(process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434') + '/api/generate'` with header `{ 'Content-Type': 'application/json' }`, body JSON containing `{ model: process.env.OLLAMA_MODEL ?? 'gemma4:26b', prompt, stream: false }`, throws if `!res.ok`, returns `(await res.json()).response`.
- Does NOT import the Vercel AI SDK or any provider package; uses direct `fetch` only.
- `src/lib/ai.test.ts` imports ONLY `{ generate }` from `'./ai'`. Mocks global fetch with `vi.stubGlobal('fetch', vi.fn())`.
- Test "ollama provider returns response text": sets `process.env.AI_PROVIDER = 'ollama'`; mocks `fetch` to resolve `{ ok: true, json: async () => ({ response: 'hello from ollama' }) }`; calls `generate('test prompt')`; asserts return value equals `'hello from ollama'`; asserts fetch was called once with first arg containing the string `'/api/generate'`.
- Test "anthropic provider returns content text": sets `process.env.AI_PROVIDER = 'anthropic'`; mocks `fetch` to resolve `{ ok: true, json: async () => ({ content: [{ text: 'hello from claude' }] }) }`; calls `generate('test prompt')`; asserts return value equals `'hello from claude'`; asserts fetch was called with first arg equal to `'https://api.anthropic.com/v1/messages'`.
- Test "throws on non-ok response": sets `process.env.AI_PROVIDER = 'ollama'`; mocks `fetch` to resolve `{ ok: false, status: 500 }`; calls `generate('prompt')`; asserts it rejects (throws).

**Testing:**
- Test ollama provider returns response text
- Test anthropic provider returns content text
- Test throws on non-ok response

---

## Story 4 — NextAuth adapter Prisma models

**Depends on:** Story 1

**Files to modify:**
- `prisma/schema.prisma`

**Acceptance Criteria:**
- `prisma/schema.prisma` gains four Auth.js adapter models appended after the domain models: `User`, `Account`, `Session`, `VerificationToken`.
- `User` fields: `id String @id @default(cuid())`, `name String?`, `email String? @unique`, `emailVerified DateTime?`, `image String?`, `accounts Account[]`, `sessions Session[]`.
- `Account` fields: `id String @id @default(cuid())`, `userId String`, `type String`, `provider String`, `providerAccountId String`, `refresh_token String?`, `access_token String?`, `expires_at Int?`, `token_type String?`, `scope String?`, `id_token String?`, `session_state String?`, `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`, `@@unique([provider, providerAccountId])`.
- `Session` fields: `id String @id @default(cuid())`, `sessionToken String @unique`, `userId String`, `expires DateTime`, `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`.
- `VerificationToken` fields: `identifier String`, `token String`, `expires DateTime`, `@@unique([identifier, token])`.
- Running `prisma generate` completes without error after this story lands.

**Testing:** not applicable — Prisma schema file; there is no vitest unit under test.

---

## Story 5 — NextAuth auth config

**Depends on:** Story 2, Story 4

**Files to create:**
- `src/auth.ts`
- `src/auth.test.ts`

**Acceptance Criteria:**
- Installs runtime dependencies `next-auth@beta` and `@auth/prisma-adapter`; both appear in `package.json` `"dependencies"` after `pnpm add next-auth@beta @auth/prisma-adapter`.
- `src/auth.ts` exports `handlers`, `auth`, `signIn`, `signOut` — these four named exports are the SOLE exports of the file.
- `src/auth.ts` imports: `NextAuth` from `'next-auth'`; the next-auth built-in `Email` provider (module specifier: the string `'next-auth'` joined with `'/providers/email'`); `PrismaAdapter` from `'@auth/prisma-adapter'`; `{ prisma }` from `'@/lib/db'`. Exports by destructuring `NextAuth({ adapter: PrismaAdapter(prisma), providers: [Email({ server: process.env.EMAIL_SERVER, from: process.env.EMAIL_FROM })] })`.
- `src/auth.test.ts` imports `* as authModule` from `'./auth'`.
- Test "exports handlers": `expect(authModule.handlers).toBeDefined()`.
- Test "exports auth": `expect(authModule.auth).toBeDefined()`.
- Test "exports signIn": `expect(authModule.signIn).toBeDefined()`.
- Test "exports signOut": `expect(authModule.signOut).toBeDefined()`.

**Testing:**
- Test exports handlers
- Test exports auth
- Test exports signIn
- Test exports signOut

---

## Story 6 — NextAuth API route

**Depends on:** Story 5

**Files to create:**
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/[...nextauth]/route.test.ts`

**Acceptance Criteria:**
- `src/app/api/auth/[...nextauth]/route.ts` exports `GET` and `POST` — these two named exports are the SOLE exports of the file.
- `src/app/api/auth/[...nextauth]/route.ts` imports `{ handlers }` from `'@/auth'` and exports via `const { GET, POST } = handlers`.
- `src/app/api/auth/[...nextauth]/route.test.ts` mocks `'@/auth'` with `vi.mock('@/auth', () => ({ handlers: { GET: vi.fn(), POST: vi.fn() } }))`. Imports `{ GET, POST }` from `'./route'`.
- Test "GET is exported": `expect(GET).toBeDefined()`.
- Test "POST is exported": `expect(POST).toBeDefined()`.

**Testing:**
- Test GET is exported
- Test POST is exported

---

## Story 7 — NextAuth middleware

**Depends on:** Story 5

**Files to create:**
- `src/middleware.ts`
- `src/middleware.test.ts`

**Acceptance Criteria:**
- Exports the default middleware function and named export `config` — these are the SOLE exports of `src/middleware.ts`.
- `src/middleware.ts` imports `{ auth }` from `'@/auth'` and exports it as default via `export { auth as default }`. Also exports `const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] }` as a named export.
- `src/middleware.test.ts` mocks `'@/auth'` with `vi.mock('@/auth', () => ({ auth: vi.fn() }))`. Imports `middleware` (default) and `{ config }` from `'./middleware'`.
- Test "default export is the auth function": `expect(middleware).toBeDefined()`.
- Test "config matcher is defined": `expect(config.matcher).toBeDefined(); expect(Array.isArray(config.matcher)).toBe(true)`.

**Testing:**
- Test default export is the auth function
- Test config matcher is defined

---

## Story 8 — AI env variables

**Depends on:** Story 3

**Files to modify:**
- `.env.example`

**Acceptance Criteria:**
- `.env.example` gains the following lines appended after its existing content (without removing any existing lines): a comment line `# AI provider: "ollama" (default, local) or "anthropic" (cloud, opt-in)`, then `AI_PROVIDER="ollama"`, then `# Ollama API base URL (used when AI_PROVIDER=ollama)`, then `OLLAMA_BASE_URL="http://localhost:11434"`, then `# Ollama model name`, then `OLLAMA_MODEL="gemma4:26b"`, then `# Anthropic API key (set AI_PROVIDER=anthropic to use)`, then `# ANTHROPIC_API_KEY=""`, then `# Anthropic model override`, then `# ANTHROPIC_MODEL="claude-sonnet-4-5"`.

**Testing:** not applicable — environment variable example file; there is no vitest unit under test.

---

## Story 9 — AI docker wiring

**Depends on:** Story 8

**Files to modify:**
- `docker-compose.yml`

**Acceptance Criteria:**
- `docker-compose.yml` `web` service `environment` block gains: `AI_PROVIDER: "ollama"`, `OLLAMA_BASE_URL: "http://host.docker.internal:11434"`, `OLLAMA_MODEL: "gemma4:26b"`.
- `docker-compose.yml` `web` service gains `extra_hosts: ["host.docker.internal:host-gateway"]` so the containerised web process can reach the host's Ollama daemon.
- The file remains valid YAML after the edit.

**Testing:** not applicable — docker-compose configuration file; there is no vitest unit under test.

---

## Story 10 — NextAuth env variables

**Depends on:** Story 5

**Files to modify:**
- `.env.example`

**Acceptance Criteria:**
- `.env.example` gains the following lines appended after its existing content (without removing any existing lines): a comment line `# NextAuth`, then `NEXTAUTH_SECRET=""` with a comment `# Generate with: openssl rand -base64 32`, then `NEXTAUTH_URL="http://localhost:3000"`, then `# Magic-link email transport (SMTP URL format)`, then `EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"`, then `EMAIL_FROM="noreply@example.com"`.

**Testing:** not applicable — environment variable example file; there is no vitest unit under test.
