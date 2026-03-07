# Notion Integration — Product Spec

## Goal
Founders connect Notion once. Connectors/investors see a fully rendered, always-fresh investor snapshot inside Warmchain — no external links, no access grants to outsiders.

---

## UX Flow

### 1. Founder connects Notion

```
/settings/integrations
  → "Connect Notion" button
  → GET /api/notion/connect
      checks auth → redirects to Notion OAuth URL
  → Notion authorization screen (user picks workspace)
  → Notion redirects to GET /api/notion/callback?code=...&state=...
  → Server exchanges code for access_token
  → Stores in notion_connections table
  → Redirects to /settings/integrations?connected=1
  → Toast: "Notion connected ✓"
```

### 2. Founder selects a page

```
/settings/integrations (connected state)
  → Dropdown: "Select your Investor Snapshot page"
  → Populated by GET /api/notion/pages
      returns list of pages in workspace (max 50)
  → Founder selects one page
  → Page ID stored in notion_connections.selected_page_id
```

### 3. Founder syncs

```
  → "Sync now" button → POST /api/notion/sync
  → Server fetches blocks from Notion API (recursive, up to depth 3)
  → Renders blocks to sanitized HTML
  → Stores in notion_snapshots (version incremented)
  → Old snapshots: is_current = false (keep last 10)
  → Response: { ok: true, version: N, synced_at: ISO }
  → UI updates: "Last synced: just now"
```

### 4. Connector views profile

```
/f/[username] → "Snapshot" tab
  → Client fetches notion_snapshots WHERE founder_username = '...' AND is_current = true
  → Renders stored HTML with Warmchain typography + dark theme
  → No Notion access required, no external link shown
```

### 5. Disconnect

```
  → "Disconnect Notion" button (with confirm dialog)
  → DELETE /api/notion/disconnect
  → Deletes notion_connections row
  → Sets notion_snapshots.is_current = false for all
  → Redirects to /settings/integrations?disconnected=1
```

---

## States / Screens

| State | What founder sees |
|-------|------------------|
| Not connected | "Connect Notion" CTA + description |
| Connected, no page selected | Page dropdown + "Select a page to enable Snapshot" |
| Connected, page selected, never synced | "Sync now" button prominent |
| Synced | "Last synced: X ago" + "Sync now" + page name |
| Sync error | Error message + "Retry" button |
| Rate limited | "Slow down — try again in Xm" |

---

## Data Model

### `notion_connections`
```sql
CREATE TABLE notion_connections (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token          text NOT NULL,          -- Notion bearer token
  workspace_id          text NOT NULL,
  workspace_name        text,
  workspace_icon        text,
  bot_id                text NOT NULL,
  selected_page_id      text,                   -- which page to sync
  selected_page_title   text,
  last_synced_at        timestamptz,
  sync_error            text,                   -- last error message if any
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

### `notion_snapshots`
```sql
CREATE TABLE notion_snapshots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  founder_username  text NOT NULL,
  page_id           text NOT NULL,
  page_title        text,
  rendered_html     text NOT NULL,    -- sanitized HTML for display
  blocks_json       jsonb,            -- raw blocks for future re-render
  word_count        integer,
  version           integer NOT NULL DEFAULT 1,
  is_current        boolean DEFAULT true,
  synced_at         timestamptz DEFAULT now()
);
```

---

## RLS Policies

```sql
-- notion_connections: private to owner (access token is sensitive)
ALTER TABLE notion_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY nc_owner ON notion_connections FOR ALL USING (user_id = auth.uid());

-- notion_snapshots: current snapshots public; all by owner
ALTER TABLE notion_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY ns_public  ON notion_snapshots FOR SELECT USING (is_current = true);
CREATE POLICY ns_owner   ON notion_snapshots FOR ALL   USING (user_id = auth.uid());
```

Note: service role bypasses RLS — all server-side sync uses service role.

---

## Sync Strategy

### On-demand sync (P0)
- Triggered by founder clicking "Sync now"
- POST /api/notion/sync → fetches + renders → stores
- Rate limit: 1 sync per 30 seconds per user (stored in notion_connections.last_synced_at check)

### Auto sync (P1)
- Vercel Cron: every 6 hours
- Iterate all notion_connections where selected_page_id IS NOT NULL
- Skip if last_synced_at > now() - 6h
- Respect Notion rate limits: max 3 req/sec (add 350ms delay between syncs)

---

## Notion API Rate Limits

| Limit | Value |
|-------|-------|
| Requests per second | 3 |
| Requests per minute | 180 |
| Retry-After header | Respected |
| Response for 429 | `{ "object": "error", "status": 429, "code": "rate_limited" }` |

Handling: on 429, store error in sync_error, surface to founder.

---

## Block Renderer — Supported Block Types

| Notion block | HTML output |
|---|---|
| paragraph | `<p>` |
| heading_1 | `<h2>` (h1 reserved for company name) |
| heading_2 | `<h3>` |
| heading_3 | `<h4>` |
| bulleted_list_item | `<ul><li>` (grouped) |
| numbered_list_item | `<ol><li>` (grouped) |
| to_do | styled checkbox div |
| toggle | `<details><summary>` |
| quote | `<blockquote>` |
| callout | styled callout div with emoji |
| code | `<pre><code>` |
| divider | `<hr>` |
| table + table_row | `<table><thead><tbody>` |
| image | `<figure><img>` with caption |
| bookmark | styled link card |
| child_page | link |

### Rich Text Annotations
- bold → `<strong>`, italic → `<em>`, code → `<code>`
- strikethrough → `<s>`, underline → `<u>`
- links → `<a rel="noopener noreferrer">` (external, opens new tab)
- colors → ignored (always use theme colors)

### Security
- All `plain_text` content is HTML-escaped before injection
- No `dangerouslySetInnerHTML` of raw Notion HTML — we generate all HTML
- Image URLs: rendered as-is (Notion signed URLs expire ~1h; P1 will cache)
- No script injection possible (we don't pass arbitrary content to innerHTML)

---

## Permission Model

| Role | Can see snapshot |
|------|-----------------|
| Anyone with profile link | Yes (public by default) |
| Non-logged-in visitor | Yes |
| Connector | Yes |
| Owner (founder) | Yes + can edit/sync |
| Other founder | Yes |

P1: Add `visibility` column to profiles: `public | connectors_only | invite_only`

---

## Error Handling

| Error | User-facing message | Action |
|-------|---------------------|--------|
| Token expired | "Reconnect Notion to continue syncing" | Show reconnect button |
| Page not found | "The selected page no longer exists" | Show page re-select |
| Rate limited | "Syncing too fast — try again in X minutes" | Disable sync button |
| Page too large | "Page has too many blocks — try a simpler page" | Truncate at 500 blocks |
| Network error | "Sync failed — check connection" | Retry button |

---

## Notion Developer Console Setup

1. Go to https://www.notion.so/profile/integrations
2. Click "New integration" → select type: **Public**
3. Fill in:
   - Name: `Warmchain`
   - Website: `https://warmchain.co`
   - Privacy policy: `https://warmchain.co/privacy`
   - Redirect URIs: `https://warmchain.co/api/notion/callback`
4. Click Save → copy **OAuth Client ID** and **OAuth Client Secret**
5. In Vercel dashboard → Settings → Environment Variables:
   - `NOTION_CLIENT_ID` = the Client ID
   - `NOTION_CLIENT_SECRET` = the Client Secret
6. Redeploy

Note: Integration must be "Public" type (not "Internal") to support OAuth.
