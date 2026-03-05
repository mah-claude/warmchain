# Changelog

## Dashboard Rebuild — Command Center (2026-03-05)

### Founder Dashboard
- **4 tabs**: Overview, Intro Requests, My Network, Activity Feed
- **Overview**: 4 stat cards (Profile Views, Requests Sent, Acceptance Rate, Active Network) + AreaChart (30-day profile views) + BarChart (requests by month) + profile quick-actions card
- **GitHub integration**: Added `github_repo` field to builder (Step 3). Overview shows repo stats (open issues, stars, last push) + last 5 commits with SHA, message, author, time. Data fetched from GitHub REST API.
- **Intro Requests tab**: Filter by All / Pending / Accepted / Declined with live counts. Full message preview, connector info, date.
- **My Network tab**: Grid of accepted connectors with expertise tags, bio snippet, link to profile.
- **Activity Feed**: Timeline of all request events (sent, accepted, declined) sorted by date.

### Connector Dashboard
- **3 tabs**: Pending, History, Analytics
- **Analytics tab**: BarChart (requests by month) + response breakdown progress bars (accepted/declined/pending %) + expertise tags
- **Upgraded stats**: 4 stat cards — Requests Received, Intros Made, Response Rate (color-coded), Profile Views
- **Shared DashNav**: Extracted nav with notification panel (mark-all-read), role badge, username badge

### DB Migration
- Added `github_repo text` column to `profiles` table via Supabase Management API

### Dependencies
- Added `recharts` (AreaChart, BarChart, ResponsiveContainer, CartesianGrid, Tooltip)

### Build
- `npm run build` — 17 routes, zero errors, TypeScript clean.

---



## Auth Fix — Session Persistence + Owner Detection (2026-03-05)

### Root Cause
`proxy.ts` was the correct filename for Next.js 16 middleware, but:
1. The exported function was named `proxy` in the original but the implementation was missing proper cookie propagation — refreshed tokens weren't being written back to both the request AND response, so tokens expired silently.
2. The route matcher only covered `/builder`, leaving every other route without session refresh.

### Fixed
- **`proxy.ts`**: Rewrote cookie handling to update both `request.cookies` and `supabaseResponse.cookies` so refreshed JWTs are propagated correctly on every request.
- **`proxy.ts`**: Expanded route matcher from `['/builder']` to all routes except static assets — sessions now refresh on every navigation.
- **`proxy.ts`**: Switched from `getSession()` to `getUser()` which hits the auth server and forces a token refresh.

### Owner Detection — `/f/[username]`
- Detects if the logged-in user owns the founder profile (matches `profile.user_id === user.id`).
- **Owner sees**: Yellow banner "This is how others see your profile" + Edit Profile button + Back to Dashboard nav link.
- **Visitor (logged out)**: Public view + "Create yours — Free" CTA + signup prompt footer.
- **Visitor (logged in, non-owner)**: Public view + "Browse Connectors" link (no double-CTA).
- Skips view tracking for profile owner to keep view counts accurate.

### Owner Detection — `/c/[username]`
- Detects if the logged-in user owns the connector profile.
- **Owner sees**: Banner "This is how founders see your profile" + Edit Profile button + Back to Dashboard with unread notification count badge.
- **Non-owner founder**: Request Intro button (unchanged).
- **Logged-out visitor**: Public view + "Join as Founder" CTA.
- Request Intro button hidden for connector owner (can't intro yourself).

### Edit Profile — `/builder` and `/connector-builder`
- Both builder pages now prefill form data when the user already has a profile.
- Submit uses `update` (not `insert`) for existing profiles — no duplicate records.
- Username field is `readOnly` when editing (changing URL would break existing links).
- Button text updates: "Save Changes" vs "Create Profile".
- After save, navigates to the updated profile page.

### Build
- `npm run build` — 17 routes, zero errors, `ƒ Proxy (Middleware)` confirmed active.

---


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
