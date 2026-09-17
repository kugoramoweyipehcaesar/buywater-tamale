# Migrate BuyWater database: Render Free Postgres → Supabase Free

**Why:** Render free Postgres expires (~30 days) and is deleted after a short grace period. Supabase free keeps your project; it may pause after inactivity but **data is not wiped** the same way.

Prisma stays the ORM. Only the host of `DATABASE_URL` changes.

---

## Step 1 — Create Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. **New project** → pick org, name (e.g. `buywater-tamale`), set a strong DB password, choose a region close to your users (or to Render).
3. Wait until the project is ready.

---

## Step 2 — Connection strings

In Supabase: **Project Settings → Database**.

### A) Transaction pooler (use as `DATABASE_URL` on Render)

Best for the running Next.js app (many short connections):

```text
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

Example shape (yours will differ):

```text
postgresql://postgres.abcdefghxyz:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### B) Direct connection (use as `DIRECT_URL` for migrations / `prisma db push`)

```text
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

Or the **direct** host Supabase shows (port **5432**, not pooler 6543).

> Tip: Prefer copying the exact URIs from the Supabase dashboard (URI / Connection string) so region and ref are correct.

---

## Step 3 — Optional Prisma `directUrl` (recommended)

If you use pooler for `DATABASE_URL`, add to `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Keep all models unchanged. Then set both env vars on Render.

---

## Step 4 — Move existing data (if you already have users on Render)

**While Render Postgres is still alive:**

```bash
# Export from Render (use External Database URL from Render Postgres dashboard)
pg_dump "postgresql://USER:PASSWORD@HOST:5432/DBNAME" --no-owner --no-acl -F c -f buywater_backup.dump

# Or plain SQL:
pg_dump "YOUR_RENDER_EXTERNAL_DATABASE_URL" --no-owner --no-acl -f buywater_backup.sql
```

**Import into Supabase** (use **direct** URL, port 5432):

```bash
psql "YOUR_SUPABASE_DIRECT_URL" -f buywater_backup.sql
# or: pg_restore -d "YOUR_SUPABASE_DIRECT_URL" --no-owner --no-acl buywater_backup.dump
```

If the DB is empty and you only need schema + admin seed:

```bash
export DATABASE_URL="YOUR_SUPABASE_DIRECT_URL"
npx prisma db push
node scripts/seed.js
```

---

## Step 5 — Render Environment variables

In **Render → buywater-tamale → Environment**, set:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Supabase **Transaction pooler** URI (`?pgbouncer=true`, port 6543) |
| `DIRECT_URL` | Supabase **direct** URI (port 5432) — if you added `directUrl` in schema |
| `JWT_SECRET` | Long random secret (keep stable so sessions stay valid) |
| `APP_URL` | `https://buywater-tamale.onrender.com` |
| `SUPER_ADMIN_EMAIL` | your admin email |
| `NODE_VERSION` | `20.11.0` (optional if set in render.yaml) |
| `NEXT_PUBLIC_SUPABASE_URL` | optional, for future client SDK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional, for future client SDK |
| SMTP_* | as before, if you use email |

**Do not** point `DATABASE_URL` at the old Render `buywater-db` after cutover.

---

## Step 6 — Deploy this repo

1. Merge/push the updated `render.yaml` and `package.json` (no free Postgres service; start = `npm start` only).
2. In Render: **Manual Deploy** → clear build cache if a previous deploy failed.
3. **Build** should run: `npm install && npx prisma generate && npm run build`
4. **Start** should run: `npm start` → `next start -p $PORT`  
   - Does **not** run `db push` or seed on every boot (avoids surprises and faster cold starts).
5. One-time after first successful deploy (Render Shell or local against Supabase):

```bash
npx prisma db push
node scripts/seed.js
```

6. Test: `/login`, `/admin-login`, create order, confirm users persist after restart.

---

## Step 7 — Decommission Render Postgres

Only after Supabase works in production:

1. Take a final backup of Render DB.
2. Delete **buywater-db** (or leave it until expiry if you want a safety buffer).
3. Confirm `render.yaml` has **no** `databases:` block (this repo version already removes it).

---

## Quick checklist

- [ ] Supabase project created  
- [ ] `DATABASE_URL` = pooler URI on Render  
- [ ] Schema pushed (`prisma db push`)  
- [ ] Data migrated or seed run  
- [ ] Login works on live URL  
- [ ] Old Render free DB no longer required  

## Notes

- Prisma models are unchanged; only the host behind `DATABASE_URL` changes.
- Free Supabase can **pause** after long inactivity; unpausing restores data (unlike Render free Postgres hard delete after expiry).
- Never commit real passwords or full connection strings to Git.
