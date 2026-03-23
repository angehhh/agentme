-- Tabla de favoritos para guardar ofertas
CREATE TABLE IF NOT EXISTS favorites (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  company    text DEFAULT '',
  location   text DEFAULT '',
  url        text NOT NULL,
  posted     text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Indice para buscar rapido por usuario
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Evitar duplicados: mismo usuario + misma URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_url ON favorites(user_id, url);

-- RLS: cada usuario solo ve y gestiona sus favoritos
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
