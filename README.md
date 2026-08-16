# Partner Coach Bot

## Problem Statement

A private Telegram relationship coach that learns Thomas's wife over years — her likes, dislikes, jokes, moods, dreams, events, gifts and trips — and coaches him with timely suggestions, plus a web portrait of her and metrics on how well he's studying.

## Solution Statement

Telegram bot that learns your partner's preferences and coaches you with timely relationship suggestions plus web dashboard

Built with Next.js (App Router, TypeScript), Tailwind, Prisma + PostgreSQL, and Zod.

## Getting Started

### Prerequisites

- Node.js + [pnpm](https://pnpm.io)
- [Docker](https://www.docker.com) (for the local Postgres)

### Run it locally

```bash
cp .env.example .env.local   # local secrets (gitignored); DATABASE_URL → compose Postgres
docker compose up -d     # start Postgres on localhost:5432
pnpm install
pnpm prisma db push      # apply the Prisma schema
pnpm dev                 # http://localhost:3000
```

Tear down the database with `docker compose down` (add `-v` to wipe its data).
