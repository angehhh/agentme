-- Proyectos por vídeo: una sesión agrupa todos los MP4/ZIP del mismo YouTube.
-- Tras 2 días caduca la sesión y se borran filas hijas (CASCADE) + Storage vía cron/API.
--
-- OBLIGATORIO si ves error PGRST205 / "Could not find youtube_render_sessions":
-- Ejecuta este script en Supabase → SQL Editor DESPUÉS de create_youtube_render_projects.sql

CREATE TABLE IF NOT EXISTS youtube_render_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_video_id  text NOT NULL,
  youtube_url       text NOT NULL DEFAULT '',
  video_title       text NOT NULL DEFAULT '',
  clips_plan        jsonb NULL, -- snapshot del pack IA (clips sugeridos) para el detalle del proyecto
  expires_at        timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS youtube_render_sessions_user_expires_idx
  ON youtube_render_sessions (user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS youtube_render_sessions_user_video_idx
  ON youtube_render_sessions (user_id, youtube_video_id);

ALTER TABLE youtube_render_projects
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES youtube_render_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS youtube_render_projects_session_idx
  ON youtube_render_projects (session_id);

ALTER TABLE youtube_render_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "youtube_render_sessions_select_own" ON youtube_render_sessions;
DROP POLICY IF EXISTS "youtube_render_sessions_delete_own" ON youtube_render_sessions;

CREATE POLICY "youtube_render_sessions_select_own"
  ON youtube_render_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "youtube_render_sessions_delete_own"
  ON youtube_render_sessions FOR DELETE
  USING (auth.uid() = user_id);
