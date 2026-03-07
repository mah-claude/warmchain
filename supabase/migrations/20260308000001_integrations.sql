-- URL-based integrations for founder profiles
-- All fields are optional; founders paste their public URLs
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS yc_batch        text,           -- e.g. "W24", "S23"
  ADD COLUMN IF NOT EXISTS linkedin_url    text,           -- https://linkedin.com/in/...
  ADD COLUMN IF NOT EXISTS notion_url      text,           -- public Notion page URL
  ADD COLUMN IF NOT EXISTS pitch_url       text,           -- pitch.com deck URL
  ADD COLUMN IF NOT EXISTS docsend_url     text,           -- docsend.com URL
  ADD COLUMN IF NOT EXISTS linear_url      text,           -- linear.app roadmap URL
  ADD COLUMN IF NOT EXISTS producthunt_url text;           -- producthunt.com/products/...
