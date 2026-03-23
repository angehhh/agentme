-- Renders YouTube 9:16 / ZIP guardados 2 días y luego borrados (Storage + filas).
-- 1) Ejecuta este SQL en Supabase SQL Editor.
-- 2) En Dashboard → Storage → crea el bucket "youtube-renders" si el INSERT falla por permisos;
--    márcalo como privado, límite ~500 MB por objeto, MIME: video/mp4, application/zip.

CREATE TABLE IF NOT EXISTS youtube_render_projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path      text NOT NULL,
  filename          text NOT NULL,
  youtube_video_id  text NOT NULL,
  title             text NOT NULL DEFAULT '',
  kind              text NOT NULL CHECK (kind IN ('mp4', 'zip')),
  clip_index        int NULL,
  duration_sec      int NULL,
  file_size         bigint NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS youtube_render_projects_user_expires_idx
  ON youtube_render_projects (user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS youtube_render_projects_expires_idx
  ON youtube_render_projects (expires_at);

ALTER TABLE youtube_render_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "youtube_render_projects_select_own" ON youtube_render_projects;
DROP POLICY IF EXISTS "youtube_render_projects_delete_own" ON youtube_render_projects;

-- Lectura/borrado solo del propio usuario (por si accedes con cliente anon en el futuro).
CREATE POLICY "youtube_render_projects_select_own"
  ON youtube_render_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "youtube_render_projects_delete_own"
  ON youtube_render_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Bucket privado para MP4/ZIP (el backend usa service role para subir).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'youtube-renders',
  'youtube-renders',
  false,
  524288000,
  ARRAY['video/mp4', 'application/zip']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Siguiente paso (sesiones por vídeo + error PGRST205 si falta): supabase/add_youtube_render_sessions.sql
