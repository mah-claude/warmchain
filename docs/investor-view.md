# Investor View — Layout Spec

## Goal
Give connectors and investors everything they need to evaluate a startup in < 10 seconds without leaving Warmchain.

---

## URL: /f/[username]

## Layout

```
┌─────────────────────────────────────────┐
│  NAV: Warmchain        [Share] [Create] │
├─────────────────────────────────────────┤
│  FAST SCAN PANEL (always visible)       │
│  ┌─────────────────────────────────┐    │
│  │ [Logo]  Company Name            │    │
│  │         Pre-seed · B2B SaaS     │    │
│  │ MRR $12k  Users 250  Growth 20% │    │
│  │ [Copy Blurb]      [Request →]   │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  TABS: [Overview] [Snapshot] [Updates]  │
│                                         │
│  Tab Content (scrollable)               │
│                                         │
└─────────────────────────────────────────┘
```

---

## Fast Scan Panel

**Always visible** (sticky below nav on scroll if possible).

Components:
- Avatar (letter-based, gradient)
- Company name + one-liner
- Stage badge
- Traction chips: MRR, Users, Growth, Stage (if present)
- "Copy Blurb" button → copies forwardable text to clipboard
- "Request Intro" CTA → opens request modal (if connector viewing)
- "✓ Request sent" badge (if already requested)
- "Edit Profile" link (if owner viewing)

Forwardable blurb (auto-generated from profile):
```
"[Company] is [one-liner]. They're at [stage] with [MRR/users/growth].
[ask truncated to 120 chars]."
```

---

## Tab: Overview

Content in order:
1. **The Ask** — emerald gradient card with ask text + needs badges
2. **Traction** — prose text from profile.traction
3. **Team** — prose text from profile.team (if present)
4. **Links** — external links with icon

Empty states:
- If no traction: "No traction data yet"
- If no team: (section hidden)

---

## Tab: Snapshot (Notion)

If Notion connected + synced:
- Rendered Notion content with dark typography
- Collapsible sections (toggle blocks render as `<details>`)
- Tables formatted cleanly
- Images with captions (full width, max 600px)
- Last synced timestamp in footer
- "Refresh" link (for owner only)

If Notion connected but no sync:
- "Syncing content soon…" with subtle spinner

If Notion not connected:
- For owners: "Connect Notion to show your investor snapshot →" CTA to /settings/integrations
- For non-owners: "Investor snapshot not available"

---

## Tab: Updates (GitHub)

If github_repo configured:

### Activity Header
```
┌──────────────────────────────────┐
│ 🔥 Product Momentum              │
│ owner/repo · 14 commits, 30 days │
│ ▮▮▮▮▯▯▮▮▮▯▯▮▯▯▯▯▮▮▮▮ (sparkline) │
└──────────────────────────────────┘
```

### What Shipped
- Last 7 commits: short SHA + message (truncated) + date
- Color-coded by type: feat/ fix/ chore/ docs/

### Latest Release (if any)
- Tag name + release title + date
- Body text (truncated to 200 chars)

### "Non-technical summary"
- Auto-generated from commit messages (P1: AI)
- P0: show last 3 commit messages cleaned up

If no github_repo:
- For owners: "Add a GitHub repo in your profile to show product momentum"
- For non-owners: (section hidden if no repo)

---

## Components

### StatusBadge
```tsx
<span className="stage-badge">Pre-seed</span>
```
Colors: Pre-seed=amber, Seed=emerald, Series A=blue, Series B+=purple

### TractionChip
```tsx
<div className="metric-chip">
  <span className="value">$12k</span>
  <span className="label">MRR</span>
</div>
```

### NotionRenderer
```tsx
<div
  className="notion-content"
  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
/>
```
CSS classes for notion-content:
- h2, h3, h4: section headings
- p: body text, gray-300
- pre code: code blocks with dark bg
- blockquote: left border emerald
- table: full width, striped rows
- .callout: rounded, icon + text
- img: max-w-full, rounded-xl

### GitHubSparkline
30-day activity grid (7 dots per row × ~4 rows):
```tsx
{days.map(day => (
  <div className={`w-2 h-2 rounded-sm ${day.active ? 'bg-emerald-500' : 'bg-white/10'}`} />
))}
```

---

## Microcopy

| Situation | Copy |
|-----------|------|
| No snapshot | "Investor snapshot not available yet" |
| Notion not connected (non-owner) | "This founder hasn't connected their Notion workspace." |
| GitHub no commits | "No recent commit activity" |
| Copy blurb success | "Copied to clipboard ✓" |
| Request already sent | "✓ Intro requested" |
| Loading profile | spinner, no text |

---

## Empty States

All empty states use:
```tsx
<div className="empty-state">
  <span className="text-4xl">{icon}</span>
  <p className="text-gray-400">{message}</p>
  {cta && <Link href={cta.href}>{cta.label}</Link>}
</div>
```

---

## Performance

- Profile data: fetched once on mount
- Notion snapshot: separate fetch (lazy, only when Snapshot tab opened)
- GitHub data: lazy fetch when Updates tab opened, 5min client cache
- No SSR needed (all client-side, avoids cold start latency)
