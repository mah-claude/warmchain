-- Add structured request fields and lifecycle timestamps to intro_requests
ALTER TABLE intro_requests
  ADD COLUMN IF NOT EXISTS ask_type text,
  ADD COLUMN IF NOT EXISTS target_profile text,
  ADD COLUMN IF NOT EXISTS why_me text,
  ADD COLUMN IF NOT EXISTS forwardable_blurb text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz;

-- Add connector_profile reputation columns
ALTER TABLE connector_profiles
  ADD COLUMN IF NOT EXISTS response_rate integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS median_response_hours integer,
  ADD COLUMN IF NOT EXISTS accept_rate integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS total_requests integer DEFAULT 0;
