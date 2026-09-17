# BuyWater (TamaleH2O) – Next.js 14 + Prisma + PostgreSQL (Supabase)

Full-stack water delivery site. Production DB: **Supabase Free Postgres** (not Render free Postgres).

## Admin login

| Field    | Value |
|----------|--------|
| Email    | kugoramoweyipehcaesar49@gmail.com |
| Password | Dominion4244 |
| Role     | ADMIN |

URL: http://localhost:3000/admin-login  ·  Live: https://buywater-tamale.onrender.com/admin-login

## Setup (local)

```bash
npm install
cp .env.example .env   # set DATABASE_URL + DIRECT_URL (or local SQLite — see schema comments)
npm run db:setup
npm run dev
```

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run db:setup` | prisma generate + db push + seed |
| `npm run db:seed` | Re-seed admin |
| `npm run db:push` | Push schema to Postgres |
| `npm run build` | prisma generate && next build |
| `npm start` | next start (Render uses this — no seed on boot) |

## Deploy on Render (free web + Supabase DB)

1. Create a **Supabase** project → copy **pooler** and **direct** connection strings.
2. See **[MIGRATE_TO_SUPABASE.md](./MIGRATE_TO_SUPABASE.md)** for full steps.
3. Render **Web Service** env:
   - `DATABASE_URL` = Supabase transaction pooler URI
   - `DIRECT_URL` = Supabase direct URI
   - `JWT_SECRET`, `APP_URL`, `SUPER_ADMIN_EMAIL`, SMTP_* as needed
4. Build: `npm install && npx prisma generate && npm run build`
5. Start: `npm start`
6. One-time after first deploy: `npx prisma db push` and `node scripts/seed.js` (Shell or local against Supabase).

**Do not use Render free Postgres** — it expires and data is deleted. This repo’s `render.yaml` has no `databases:` block.

## Stack

- Next.js 14 (App Router)
- Prisma + PostgreSQL (Supabase in production)
- bcryptjs + JWT cookies
- Tailwind CSS
