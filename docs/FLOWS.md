# Warmchain — User Flows

## Core Flow: Founder requests intro from Connector

```
Founder lands on /c/[username]
  → clicks "Request Intro"
  → if not logged in: redirect /login?next=...
  → if logged in but no founder profile: redirect /builder
  → if already requested: show "Request sent" state
  → else: open structured request composer modal

Structured Request Composer
  Fields:
  1. Ask Type        (select: investor_intro | customer_intro | hire | partnership | advice | other)
  2. Target Profile  (text: who specifically, e.g. "B2B SaaS angels in NYC")
  3. Why Me          (text: why this connector fits, e.g. "You invested in DevFlow which is adjacent")
  4. Forwardable Blurb (text: 2-3 sentences the connector can copy-paste when making intro)
  5. Timeline        (select: ASAP | 2 weeks | 1 month | flexible)

  → submit: INSERT intro_requests, trigger notification, send email
  → success: show confirmation state, set alreadyRequested = true

Connector receives notification
  → email: "New intro request from [Company]" with link to /f/[username]
  → in-app: badge on dashboard, pending tab

Connector reviews request (dashboard inbox)
  → sees structured request card: ask type, target, why me, blurb, timeline
  → one-click: Accept | Decline | (future: Ask for more info)
  → Accept: status → accepted, email sent to founder, accepted_at set
  → Decline: status → declined, email sent to founder, declined_at set

Founder receives notification
  → email: accepted or declined
  → in dashboard: status updates on sent requests
```

## Auth Flows

### Sign up
```
/signup
  → pick role (founder | connector)
  → enter email + password
  → createUser (Supabase auth)
  → send welcome email (fire-and-forget, no auth required)
  → redirect to /builder or /connector-builder
```

### Log in
```
/login
  → email + password
  → signInWithPassword
  → detect role: check profiles table → /dashboard
  → if ?next param: redirect there instead
```

### Password reset
```
/forgot-password → email
/reset-password  → new password (token from email)
```

## Profile Builder Flows

### Founder builder (/builder)
```
Step 1: Identity (username, company_name, one_liner)
Step 2: Progress (stage, traction, mrr, users_count, growth)
Step 3: The Ask (needs[], ask, team, links, github_repo)
→ upsert profiles table
→ redirect to /f/[username]
```

### Connector builder (/connector-builder)
```
Step 1: Identity (username, name, bio)
Step 2: Expertise (expertise[], helps_with[])
Step 3: Track Record (portfolio, links)
→ upsert connector_profiles table
→ redirect to /c/[username]
```

## Dashboard Flows

### Founder dashboard
- Tab: My Requests (sent, status: pending/accepted/declined)
- Tab: Analytics (profile views chart, request funnel)
- CTA: Edit profile → /builder

### Connector dashboard
- Tab: Inbox / Pending (requests to triage)
- Tab: History (accepted/declined)
- Tab: Stats (response rate, median response time, accept rate)
- Tab: Browse Founders (search/filter all founders)

## Email Flow (transactional)
```
Event: signup          → type: welcome       → to: new user
Event: new request     → type: new_request   → to: connector
Event: accept          → type: request_accepted → to: founder
Event: decline         → type: request_declined → to: founder
```
All emails sent via /api/email (POST), using Resend API.
Auth: welcome emails bypass token check; all others require Bearer token.
