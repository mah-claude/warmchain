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

## Round 2 — Security & Data (coming next)

Planned:
- Auth check on `/api/notify` to prevent unauthenticated notification injection
- Input validation audit
- RLS policy verification
