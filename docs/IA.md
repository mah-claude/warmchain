# Warmchain — Information Architecture

## Sitemap

```
/ (home)
├── /login
├── /signup
├── /forgot-password
├── /reset-password

## Founder routes
├── /builder            ← profile wizard (create / edit)
├── /f/[username]       ← public founder profile
├── /dashboard          ← founder dashboard (sent requests, analytics, edit CTA)

## Connector routes
├── /connector-builder  ← profile wizard (create / edit)
├── /c/[username]       ← public connector profile + request modal
├── /dashboard          ← connector dashboard (inbox, request triage, stats, browse founders)

## Discovery
├── /connectors         ← browse/search connectors
├── /browse/founders    ← browse/search founders

## Static / info
├── /about
├── /faq
├── /privacy
├── /terms

## Admin
└── /admin/analytics
```

## Navigation (role-based)

### Logged-out visitor
- Logo → /
- "Browse Connectors" → /connectors
- "Log in" → /login
- "Join free" → /signup

### Founder (logged in)
- Logo → /
- "Find Connectors" → /connectors
- "Dashboard" → /dashboard (with unread badge)
- "Edit Profile" → /builder
- Avatar/logout

### Connector (logged in)
- Logo → /
- "Find Founders" → /browse/founders
- "Dashboard" → /dashboard (with pending badge)
- "Edit Profile" → /connector-builder
- Avatar/logout

## URL conventions
- `/f/[username]`  — founder public profile
- `/c/[username]`  — connector public profile
- `/dashboard`     — role-detected, renders FounderDashboard or ConnectorDashboard
- Share links always use full canonical URL: `https://warmchain.co/...`
