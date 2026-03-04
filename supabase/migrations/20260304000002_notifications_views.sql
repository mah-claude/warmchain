-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type       text NOT NULL,  -- new_request | request_accepted | request_declined
  title      text NOT NULL,
  body       text NOT NULL,
  read       boolean DEFAULT false,
  request_id uuid REFERENCES intro_requests(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read, created_at DESC);

CREATE POLICY notif_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notif_insert ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY notif_update ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Profile views table
CREATE TABLE IF NOT EXISTS profile_views (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username     text NOT NULL,
  profile_type text NOT NULL,  -- founder | connector
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pv_username ON profile_views(username, created_at);

CREATE POLICY pv_insert ON profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY pv_select ON profile_views FOR SELECT USING (true);
