# cherish.ai

A study of someone you love. A Telegram coach that talks with you daily about
your relationship, remembers everything — likes, moods, gifts, dreams, trips,
running jokes — and a portrait UI that turns fifteen years of knowing someone
into something you can see.

- **Coach**: Telegram bot (@cherish_ai_bot) — 12-question onboarding, daily /
  weekly / monthly check-ins, occasion reminders, audience-tagged suggestions
- **Portrait**: `/portrait` — mood timeline, gift ledger with outcomes, study
  metrics (coverage, recency, gift success rate), inline editing
- **Local dev**: `docker compose up` — Postgres + app + Mailpit inbox
  (localhost:8025) for magic-link sign-in; coach runs on host Ollama

Deployment env: see `.env.example`.
