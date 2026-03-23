-- Tabla para links publicos de resultados compartidos
CREATE TABLE IF NOT EXISTS shared_results (
  id         text PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query      text NOT NULL,
  location   text DEFAULT '',
  jobs       jsonb NOT NULL DEFAULT '[]',
  total      int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_results_user ON shared_results(user_id);

-- Sin RLS: cualquiera con el link puede ver los resultados
-- Solo el creador puede insertar (se valida en el API route con service role)
ALTER TABLE shared_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared results"
  ON shared_results FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own shared results"
  ON shared_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared results"
  ON shared_results FOR DELETE
  USING (auth.uid() = user_id);
