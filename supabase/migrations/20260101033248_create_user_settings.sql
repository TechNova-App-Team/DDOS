CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  theme_color text DEFAULT 'grey' NOT NULL,
  accent_color text DEFAULT '#ffffff' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON user_settings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access"
  ON user_settings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON user_settings
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);