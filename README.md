# Changlun Best

A shared board built with Next.js 16, Tailwind CSS v4 and Supabase.

- **Visitors** (no login) can browse and search. They can't change anything.
- **Admin** signs in with Google (only the `ADMIN_EMAIL` account), and is the only one who can create, edit, delete, pin and reorder categories and items.
- Every board shows items in the admin's order (up/down arrows); pinned items always stay on top.
- **Sub-categories**: a category can sit inside another (one level, e.g. Makan → Mi Goreng). Its page shows its sub-categories above its own items, and each sub-category has its own items and pins.
- **Item library**: each item is stored once and can be placed in any number of categories (pinning is per category). Editing an item updates it everywhere; removing it from a category keeps it in the library; deleting it from the library removes it everywhere.
- Each item can have a **photo** (resized in the browser to 1600px WebP, stored in the public Supabase Storage bucket `item-images`) and a **location** (place name, address, coordinates or a Google Maps link) that opens in Google Maps, with an optional embedded map.

## How it works

| Piece | Where |
| --- | --- |
| DB schema + indexes + RLS + photo bucket | [supabase/schema.sql](supabase/schema.sql) |
| Upgrade an older database (item library + sub-categories) | [supabase/migrate-item-library.sql](supabase/migrate-item-library.sql) |
| Cached reads (`use cache` + `cacheTag`) | [src/lib/data.ts](src/lib/data.ts) |
| All writes (server actions, validated) | [src/app/actions.ts](src/app/actions.ts) |
| Admin session (HMAC-signed httpOnly cookie) | [src/lib/auth.ts](src/lib/auth.ts) |

Reads are cached by Next.js and invalidated with `updateTag` after each write, so pages are served from cache and the database is only hit when something changes. Indexes match the board order exactly (`pinned desc, pin_order, created_at desc`).

The browser never talks to Supabase except to load public photos. Writes (and photo uploads) go through server actions using the Supabase secret key, and RLS allows public reads only.

## Setup

1. **Supabase**: create a project, open **SQL Editor**, and run `supabase/schema.sql`.
2. **Env**: copy `.env.example` to `.env.local` and fill it in:
   - `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (Project Settings → API; the legacy `service_role` key also works)
   - `SESSION_SECRET`: 32+ random characters (`openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google Cloud → Credentials → OAuth client ID, type Web; redirect URI `https://<your-domain>/auth/google/callback`) and `ADMIN_EMAIL`, the only Google account that can sign in
3. Run it:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000, and sign in at `/admin`.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project**, import the repo (framework is detected automatically).
3. Add the env vars from `.env.example` under **Settings → Environment Variables**.
4. Deploy.

Or from the CLI: `npx vercel`, then `npx vercel env add` for each variable, then `npx vercel --prod`.
