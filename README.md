# BuyWater (TamaleH2O) – Next.js 14 + Prisma + SQLite

Full-stack water delivery site. **No Base44.** Runs entirely on your PC.

## Admin login

| Field    | Value |
|----------|--------|
| Email    | kugoramoweyipehcaesar49@gmail.com |
| Password | Dominion4244 |
| Role     | ADMIN |

URL: http://localhost:3000/admin-login

## Setup (Windows)

```powershell
cd BuyWater-Next

npm install

# Create database + seed admin & products
npm run db:setup

# Start server
npm run dev
```

Open **http://localhost:3000**

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run db:setup` | prisma generate + db push + seed |
| `npm run db:seed` | Re-seed admin (Dominion4244) |
| `npm run dev` | Start Next.js on port 3000 |

## Stack

- Next.js 14 (App Router)
- Prisma + SQLite (`prisma/dev.db`)
- bcryptjs + JWT cookies
- Tailwind CSS

## API routes

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `GET/POST /api/orders`
- `PATCH /api/orders/[id]`
- `GET/POST /api/products`
- `GET/POST /api/hostels`
- `GET/PATCH /api/settings`

## Pages

- `/` Home
- `/login` User login
- `/admin-login` Admin login
- `/register` Sign up
- `/dashboard` Customer orders
- `/order` Place order
- `/admin` Admin order management

## Troubleshooting

**404 on login** – you are still on the old Vite/Base44 project. Use this **BuyWater-Next** folder only.

**Login fails after setup** – run `npm run db:seed` again to reset admin password to `Dominion4244`.

## Email notifications

Emails are sent for:
- Password reset links (to the user who requested)
- Login alerts (to super admin)
- New orders (to super admin)
- Cancelled orders (to super admin)

Super admin inbox: `kugoramoweyipehcaesar49@gmail.com` (or `SUPER_ADMIN_EMAIL` in `.env`)

### Without SMTP (default)
Messages are printed in the terminal where `npm run dev` runs. Password reset also shows a **dev link** on the forgot-password page.

### With Gmail
1. Enable 2-Step Verification on the Gmail account
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Add to `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
SMTP_FROM="BuyWater <your@gmail.com>"
SUPER_ADMIN_EMAIL=kugoramoweyipehcaesar49@gmail.com
APP_URL=http://localhost:3000
```

4. Restart `npm run dev`

## Deploy on Render (free)

1. Set `prisma/schema.prisma` datasource `provider = "postgresql"` (already set in this build).
2. Create **PostgreSQL** (free) on Render → copy **Internal Database URL**.
3. Create **Web Service** from this repo:
   - **Build:** `npm install && npx prisma generate && npm run build`
   - **Start:** `npm run render:start`
   - **Plan:** Free
4. Environment variables: `DATABASE_URL`, `JWT_SECRET`, `APP_URL`, SMTP_*, `SUPER_ADMIN_EMAIL`.
5. After first deploy, set `APP_URL` to `https://YOUR-SERVICE.onrender.com` and redeploy.

Admin login after seed: `kugoramoweyipehcaesar49@gmail.com` / `Dominion4244`

### Local development with SQLite again

Change schema provider to `sqlite` and set:

```
DATABASE_URL="file:./dev.db"
```

Then: `npm run db:setup && npm run dev`
