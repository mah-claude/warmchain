# Changelog

## Round 1 — QA Sweep (2026-03-05)

### Fixed
- **`app/layout.tsx`**: Replaced default "Create Next App" title and description with proper Warmchain branding. Added OpenGraph metadata and title template for per-page titles.
- **`app/about/page.tsx`**: Fixed broken footer `<a href="#">Privacy</a>` and `<a href="#">Terms</a>` links — now use `<Link href="/privacy">` and `<Link href="/terms">`.
- **`app/about/page.tsx`**: Replaced `onClick={() => window.location.href = '/#product'}` nav button with proper `<Link href="/#product">` component.
- **`app/login/page.tsx`**: Added `?next=` redirect support so users returning from `/c/[username]?request=1` are sent back after login instead of always going to `/dashboard`. Wrapped in `Suspense` boundary as required by Next.js for `useSearchParams`.
- **`app/not-found.tsx`**: Created branded 404 page with Warmchain styling, helpful copy, and links to home and connectors.

### Build
- `npm run build` — 17 routes, zero errors, zero TypeScript errors.

---

## Round 2 — Security & Data (2026-03-05)

### Fixed
- **`app/api/notify/route.ts`**: Added authentication check — route now requires a valid `Authorization: Bearer <token>` header. Unauthenticated callers receive 401. Prevents anyone from injecting fake notifications to arbitrary users.
- **`app/c/[username]/page.tsx`**: Updated `/api/notify` call to include Supabase session access token in Authorization header.
- **`app/dashboard/page.tsx`**: Updated `/api/notify` call to include Supabase session access token in Authorization header.

### Verified (no changes needed)
- No `dangerouslySetInnerHTML` or `innerHTML` usage anywhere — no XSS risk.
- `SUPABASE_SERVICE_ROLE_KEY` only used in server-side API route, never in client code.
- All `NEXT_PUBLIC_` env vars are safe to expose; no private keys referenced from client components.
- RLS policies: `notifications` requires `auth.uid() = user_id` for SELECT/UPDATE; `profile_views` open insert by design (anonymous tracking).
- All form inputs use controlled React state — no raw HTML manipulation.

### Build
- `npm run build` — 17 routes, zero errors.

---

## Round 3 — UX Polish (2026-03-05)

### Fixed
- **`app/signup/backup.tsx`**: Deleted leftover backup file that had broken `href="#"` links — no user-facing impact but cleaned up the codebase.

### Verified (no changes needed)
- **Loading states**: All async buttons show spinner/disabled state during operations (login, signup, builder submit, intro request, accept/decline).
- **Error messages**: All forms show inline red error messages with specific text (not generic "error").
- **Success states**: Intro request modal shows "✓ Request sent!" success state and auto-closes.
- **Empty states**: All list views have meaningful empty states with calls to action:
  - Founder dashboard "No requests sent yet" → links to Browse Connectors
  - Connector inbox "No pending requests" with explanation
  - Notification bell "No notifications yet"
  - Connectors page "No connectors found" with filter clear
- **404 page**: Created branded 404 with navigation links.
- **Profile not found**: Both `/f/[username]` and `/c/[username]` show inline "Profile not found" state (not a crash).
- **No broken `href="#"` links** remaining in any active page.

### Build
- `npm run build` — 17 routes, zero errors.

---

## Round 4 — Performance (2026-03-05)

### Verified (no changes needed)
- **Parallel data fetching**: Dashboard uses `Promise.all` for founder + connector profile lookups.
- **Fire-and-forget profile views**: Profile view inserts don't block page render — `supabase.from('profile_views').insert(...).then(() => {})`.
- **No unnecessary re-renders**: State updates are batched correctly; `useEffect` deps are minimal.
- **No images**: App uses CSS gradients and SVG icons — no image optimization needed.
- **Supabase indexes**: `idx_notif_user` on `(user_id, read, created_at DESC)` and `idx_pv_username` on `(username, created_at)` cover the main query patterns.
- **Static routes pre-rendered**: 10 of 17 routes are static (○) — landing page, auth pages, about, faq, etc.

### Build
- `npm run build` — 17 routes, zero errors, TypeScript clean.
