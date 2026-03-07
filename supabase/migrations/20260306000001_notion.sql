-- Notion OAuth connections (one per founder)
CREATE TABLE IF NOT EXISTS notion_connections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token        text NOT NULL,
  workspace_id        text NOT NULL,
  workspace_name      text,
  workspace_icon      text,
  bot_id              text NOT NULL,
  selected_page_id    text,
  selected_page_title text,
  last_synced_at      timestamptz,
  sync_error          text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notion_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY nc_owner ON notion_connections FOR ALL USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_nc_user ON notion_connections(user_id);

-- Notion synced snapshots (versioned, up to 10 per founder)
CREATE TABLE IF NOT EXISTS notion_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  founder_username text NOT NULL,
  page_id          text NOT NULL,
  page_title       text,
  rendered_html    text NOT NULL,
  blocks_json      jsonb,
  word_count       integer,
  version          integer NOT NULL DEFAULT 1,
  is_current       boolean DEFAULT true,
  synced_at        timestamptz DEFAULT now()
);

ALTER TABLE notion_snapshots ENABLE ROW LEVEL SECURITY;
-- Current snapshots are publicly readable (profile content)
CREATE POLICY ns_public_read ON notion_snapshots FOR SELECT USING (is_current = true);
-- Owner can do everything
CREATE POLICY ns_owner_all   ON notion_snapshots FOR ALL   USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ns_username ON notion_snapshots(founder_username, is_current);
CREATE INDEX IF NOT EXISTS idx_ns_user     ON notion_snapshots(user_id, is_current);

-- Profile visibility settings (add to existing profiles table)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notion_enabled boolean DEFAULT false;

-- Analytics events for Notion/GitHub feature
-- (uses existing page_analytics table with event column)
-- Events: notion_connected, notion_page_selected, notion_sync_success,
--         notion_sync_fail, snapshot_viewed, github_updates_viewed
