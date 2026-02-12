# Warmchain

Package your startup. Get warm intros. One shareable link for founders.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **Supabase** (Auth + Postgres)
- **Tailwind CSS 4**

## Getting started

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment variables**

   Create `.env.local` in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Get these from [Supabase Dashboard](https://supabase.com/dashboard) → your project → Settings → API.

3. **Supabase setup**

   - Create a `profiles` table (or run your migrations) with columns: `user_id`, `username`, `company_name`, `one_liner`, `stage`, `traction`, `ask`, `team`, `links`.
   - Enable Email auth in Authentication → Providers.

4. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint

## Project structure

- `app/` — Next.js App Router pages (home, login, signup, builder, profile, about, FAQ)
- `components/` — shared UI (e.g. AIChat)
- `lib/` — Supabase client, shared types, utilities

## Deploy

Deploy on [Vercel](https://vercel.com) and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project environment.
