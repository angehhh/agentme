-- Sleep Mode: cola de trabajos diferidos (MVP con worker por cron).
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS sleep_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  goal text NOT NULL DEFAULT '',
  state jsonb NOT NULL DEFAULT '{"phase": 0, "trace": []}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sleep_jobs_status_created ON sleep_jobs (status, created_at);

ALTER TABLE sleep_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sleep_jobs_select_own" ON sleep_jobs;
DROP POLICY IF EXISTS "sleep_jobs_insert_own" ON sleep_jobs;

CREATE POLICY "sleep_jobs_select_own"
  ON sleep_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sleep_jobs_insert_own"
  ON sleep_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
