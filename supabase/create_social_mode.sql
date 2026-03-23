-- Social Mode — preferencias del calendario editorial (1 fila por usuario)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS social_settings (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  niche       text NOT NULL DEFAULT '',
  audience    text NOT NULL DEFAULT '',
  tone        text NOT NULL DEFAULT 'profesional y cercano',
  main_platform text NOT NULL DEFAULT 'Instagram',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_settings_select_own" ON social_settings;
DROP POLICY IF EXISTS "social_settings_insert_own" ON social_settings;
DROP POLICY IF EXISTS "social_settings_update_own" ON social_settings;

CREATE POLICY "social_settings_select_own"
  ON social_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "social_settings_insert_own"
  ON social_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "social_settings_update_own"
  ON social_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
