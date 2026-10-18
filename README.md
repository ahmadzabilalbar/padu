# Changlun Best

A shared board built with Next.js 16, Tailwind CSS v4 and Supabase.

- **Anyone** (no login) can add items to a category, search, and sort items (Newest / Oldest / A–Z / Z–A).
- **Admin** signs in with a single password, is the only one who can create categories, and has the last say: pin categories or items to the top, reorder pinned ones, add items to any category (optionally pinned), and delete.
- Pinned items always stay on top, in the admin's order, whatever sort a visitor picks.

## How it works

| Piece | Where |
| --- | --- |
| DB schema + indexes + RLS | [supabase/schema.sql](supabase/schema.sql) |
| Cached reads (`use cache` + `cacheTag`) | [src/lib/data.ts](src/lib/data.ts) |
| All writes (server actions, validated) | [src/app/actions.ts](src/app/actions.ts) |
| Admin session (HMAC-signed httpOnly cookie) | [src/lib/auth.ts](src/lib/auth.ts) |

Reads are cached by Next.js and invalidated with `updateTag` after each write, so pages are served from cache and the database is only hit when something changes. Indexes match the board order exactly (`pinned desc, pin_order, created_at desc`).

The browser never talks to Supabase. Writes go through server actions using the Supabase secret key, and RLS allows public reads only.

## Setup

1. **Supabase**: create a project, open **SQL Editor**, and run `supabase/schema.sql`.
2. **Env**: copy `.env.example` to `.env.local` and fill it in:
   - `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (Project Settings → API; the legacy `service_role` key also works)
   - `ADMIN_PASSWORD`: the admin's password
   - `SESSION_SECRET`: 32+ random characters (`openssl rand -base64 32`)
3. Run it:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000, and sign in at `/admin`.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project**, import the repo (framework is detected automatically).
3. Add the four env vars from `.env.example` under **Settings → Environment Variables**.
4. Deploy.

Or from the CLI: `npx vercel`, then `npx vercel env add` for each variable, then `npx vercel --prod`.

## Notes

- Posting is open to everyone, so spam is handled by input limits, a honeypot field, and admin deletion. If it becomes a problem, add rate limiting (e.g. Vercel WAF rules or Upstash) in `createCategory` / `createItem`.
