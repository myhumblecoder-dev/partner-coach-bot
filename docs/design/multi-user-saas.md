# Multi-user SaaS: Google login + Stripe — SHELVED

**Status: SHELVED (2026-08-20).** Decision: cherish.ai stays personal.
The pros outweighed the cons *only* because the build cost is near-zero
(~2–3 days of pipeline grinding); $100/mo (≈25 subscribers at $49/yr) was
judged ~60–70% reachable within 6 months — but only with sustained
distribution work, which is the actual product. This document preserves the
full design so un-shelving is a decision, not a re-derivation.

---

## Market honesty (assessment as of 2026-08)

- **Category physics:** couples/relationship apps are a retention graveyard
  — the daily touchpoint becomes homework, notifications get muted, D30
  retention is among consumer software's worst. Paired leads the category
  with a two-sided daily-question model and heavy paid acquisition
  ($3–8+/install against low-single-digit subscription conversion).
- **The biggest product risk is optics, not tech:** cherish.ai is
  *one-sided* — an AI dossier about a partner who hasn't consented. Every
  two-sided competitor structurally avoids this framing. Mitigations if ever
  public: position around thoughtfulness/gifting, and ship an "invite your
  partner" consent mode before any launch push.
- **Channel handicap:** Telegram is fine for a beta, weak for mainstream US
  couples (iMessage/SMS territory). Twilio A2P or a native app are later
  costs to acknowledge.
- **Economics are a non-issue:** Haiku daily use ≈ $0.10–0.35/user/mo,
  infra cents. Honest price band $4–8/mo or $40–60/yr → ~95% margin. Churn,
  not margin, is the risk.
- **Genuine differentiation:** provenance-marked, human-editable memory;
  weekly facet synthesis; gift outcomes feeding suggestions. Nobody in the
  category has this machinery. Nearest one-sided comps (personal-relationship
  assistants, gift-reminder apps) are thin or dead — either no market, or an
  open niche.
- **Distribution thesis:** the build story ("I built an AI to study my wife
  of 15 years, and a local bot army wrote the code") is the viral-shaped
  asset; without publishing it, expect ~$0. With it: invite/waitlist beta,
  $49/yr, 14-day card-free trial.

## Security findings (harmless single-user, CRITICAL multi-user)

Found during exploration; must be fixed in Phase A if un-shelved:

1. **Server-action IDOR:** `addEntry`/`addMood` accept a client-supplied
   `profileId`; `editEntry`/`rateGift` update `where: { id }` with no
   ownership scoping. Any authenticated user could mutate any tenant's rows.
2. **Login never enforced:** `src/auth.ts` defines no `authorized` callback,
   so `src/proxy.ts` (`export default auth`) attaches a session but never
   redirects unauthenticated visitors.
3. **Disjoint graphs:** Auth.js `User` and domain `Profile` have no relation
   — there is no concept of "whose data" anywhere.

---

## The 4-phase implementation plan

Pre-made decisions: `Profile.userId String? @unique` (1:1, additive/two-phase
like `Portrait.entries`); keep magic-link alongside Google (local dev via
Mailpit depends on it); Telegram deep-link one-time codes; Stripe Checkout
with 14-day trial and `payment_method_collection: 'if_required'` (trial
without card); `trialing` counts as active; daily message cap at the webhook.

### Phase A — Tenancy + auth hardening

- Schema: `Profile.userId String? @unique` + `User.profile Profile?`.
- `src/auth.ts`: add `Google` provider (Auth.js v5 auto-reads
  `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`) with
  `allowDangerousEmailAccountLinking: true` (links the existing magic-link
  User to the same-email Google login), plus:

  ```ts
  callbacks: {
    authorized({ auth, request }) {
      if (request.nextUrl.pathname === '/') return true // public landing
      return !!auth?.user
    },
  }
  ```

  `src/proxy.ts` unchanged — the callback makes its existing matcher enforce.
- New `src/lib/tenancy/requireProfile.ts`: `auth()` → the session user's
  profile, **created on first login** (`name: 'Your person'`); redirect to
  sign-in when no session. The single source of "whose data" for every page
  and action.
- Fix both `findFirst` sites: `src/app/portrait/page.tsx` uses
  `requireProfile()`; `src/lib/onboarding/link.ts` is rewritten in Phase B.
- IDOR fixes: `addEntry`/`addMood` drop the `profileId` parameter (derive
  server-side); `editEntry`/`rateGift` switch their dispatch tables to
  `updateMany`/`deleteMany({ where: { id, profileId } })` returning
  `{ ok: count === 1 }`. Update `PortraitView`/`EntryForm`/`MoodForm` props.
- One-off `scripts/claim-profile.ts`: binds the existing production profile
  to the owner's User by email after first login. Idempotent.

### Phase B — Telegram linking (N users, one bot)

- Schema:

  ```prisma
  model LinkCode {
    id        String    @id @default(cuid())
    code      String    @unique
    profileId String
    expiresAt DateTime
    usedAt    DateTime?
    createdAt DateTime  @default(now())
    profile   Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)
  }
  ```

- New `src/lib/telegram/linkCode.ts`: `createLinkCode(profileId)` —
  crypto-random url-safe code (Telegram `start` payload ≤64 chars of
  `[A-Za-z0-9_-]`), 15-minute TTL; `consumeLinkCode(code, chatId)` —
  transactional, single-use, `telegramChat.upsert` so a chat can re-link.
- `src/lib/onboarding/link.ts`: `ensureLinkedProfile` →
  `getLinkedProfile(chatId)` — lookup only; the auto-bind-to-first-profile
  behavior is removed.
- Webhook `src/app/api/telegram/route.ts`: `/start <code>` → consume, link,
  begin onboarding. Unlinked chats → "Sign in at the site and tap Connect
  Telegram" (always HTTP 200 — Telegram retries non-2xx forever).
- Portrait page gains a "Connect Telegram" section; server action returns
  `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${code}`.

### Phase C — Stripe

- Dep: `stripe` (server-only; Checkout is a redirect).
- Schema:

  ```prisma
  model Subscription {
    id                   String   @id @default(cuid())
    userId               String   @unique
    stripeCustomerId     String   @unique
    stripeSubscriptionId String   @unique
    status               String
    priceId              String
    currentPeriodEnd     DateTime
    createdAt            DateTime @default(now())
    updatedAt            DateTime @updatedAt
  }
  ```

- `src/lib/billing/stripe.ts` (lazy client), `subscription.ts`
  (`hasActiveSubscription`: status ∈ {active, trialing} + 24h grace on
  `currentPeriodEnd`; pure part unit-testable), `events.ts` (pure mapping of
  `checkout.session.completed` / `customer.subscription.updated` /
  `customer.subscription.deleted` → upsert data; thin route does I/O).
- Webhook `src/app/api/stripe/route.ts` (already outside the auth matcher):

  ```ts
  export async function POST(request: Request) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    const event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
    // dispatch via events.ts → prisma.subscription.upsert
    return Response.json({ received: true })
  }
  ```

- `src/app/billing/page.tsx` + `src/app/actions/billing.ts`:
  `startCheckout()` — `mode: 'subscription'`, `client_reference_id: userId`,
  `subscription_data: { trial_period_days: 14 }`,
  `payment_method_collection: 'if_required'`; `openPortal()` — Billing
  Portal for cancel/manage.
- Gating via `hasActiveSubscription` at three points: portrait page (paywall
  banner, data visible, forms blocked), Telegram webhook ("subscription
  lapsed — manage at /billing", HTTP 200, skip respond), cron (skip inactive
  owners). Unclaimed legacy profile passes until the claim script runs.

### Phase D — Ops & limits

- `src/lib/limits/dailyCap.ts`: pure cap check +
  `message.count({ role: 'user', createdAt: { gte: utcMidnight } })`;
  enforced at the webhook before `respond()`. `COACH_DAILY_LIMIT` default
  30; cron check-ins exempt.
- Cron: wrap the whole per-chat body in try/catch (today one tenant's
  failure aborts everyone after it).
- Deferred to v2: per-tenant token attribution, batching cursor for the cron
  loop, per-tenant timezones.

## Env vars

| Var | Purpose | Phase |
|---|---|---|
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client (redirect `<origin>/api/auth/callback/google`) | A |
| `TELEGRAM_BOT_USERNAME` | deep-link URL | B |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID` | billing | C |
| `COACH_DAILY_LIMIT` | webhook cap (default 30) | D |

## Verification appendix

- **A:** two Mailpit sign-ins → two isolated profiles; cross-account edit
  returns `{ok:false}` (updateMany count 0); logged-out `/portrait`
  redirects; Google flow smoke-tested on a preview deploy.
- **B:** curl the webhook with a `/start <code>` update → chat binds to the
  signed-in user's profile; same code twice fails; unlinked chat gets the
  link-via-site reply.
- **C:** `stripe listen --forward-to localhost:3000/api/stripe` +
  `stripe trigger` the three events → Subscription row transitions; test
  card 4242 clears the paywall; portal cancel flips the webhook reply and
  cron skips.
- **D:** `COACH_DAILY_LIMIT=2` → third webhook curl hits the limit message;
  cron with one poisoned profile still processes the rest.

## Deploy order per phase

`prisma db push` (Neon) → merge/deploy → phase manual step (A: claim script
after first Google login; C: create the Stripe product/price + dashboard
webhook endpoint).

## Launch posture, if un-shelved

Invite/waitlist beta · $49/yr · 14-day card-free trial · publish the build
story as the growth engine · "invite your partner" consent mode before any
public push.
