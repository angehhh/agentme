-- Marcar proyectos Shorts como guardados (pestaña «Guardados»).
-- Ejecutar en Supabase SQL Editor si ya tienes youtube_render_sessions.

ALTER TABLE youtube_render_sessions
  ADD COLUMN IF NOT EXISTS is_saved boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS youtube_render_sessions_user_saved_idx
  ON youtube_render_sessions (user_id, is_saved)
  WHERE is_saved = true;

DROP POLICY IF EXISTS "youtube_render_sessions_update_own" ON youtube_render_sessions;

CREATE POLICY "youtube_render_sessions_update_own"
  ON youtube_render_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
