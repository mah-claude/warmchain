-- Add new fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS needs text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mrr text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS users_count text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS growth text;

-- Create intro_requests table
CREATE TABLE IF NOT EXISTS intro_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connector_user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  founder_username   text NOT NULL,
  connector_username text NOT NULL,
  message            text NOT NULL,
  status             text NOT NULL DEFAULT 'pending',  -- pending | accepted | declined
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ir_founder   ON intro_requests(founder_user_id);
CREATE INDEX IF NOT EXISTS idx_ir_connector ON intro_requests(connector_user_id);

ALTER TABLE intro_requests ENABLE ROW LEVEL SECURITY;

-- Either party can read their own requests
CREATE POLICY ir_select ON intro_requests FOR SELECT
  USING (auth.uid() = founder_user_id OR auth.uid() = connector_user_id);

-- Only founders can create requests
CREATE POLICY ir_insert ON intro_requests FOR INSERT
  WITH CHECK (auth.uid() = founder_user_id);

-- Only connectors can update status
CREATE POLICY ir_update ON intro_requests FOR UPDATE
  USING (auth.uid() = connector_user_id);
