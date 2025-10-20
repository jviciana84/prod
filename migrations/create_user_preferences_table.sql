-- Crear tabla para almacenar las preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark',
  main_page JSONB,
  favorite_pages JSONB[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Añadir índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Añadir comentarios a la tabla
COMMENT ON TABLE user_preferences IS 'Almacena las preferencias de usuario como tema y páginas favoritas';
COMMENT ON COLUMN user_preferences.theme IS 'Tema preferido: light, dark o system';
COMMENT ON COLUMN user_preferences.main_page IS 'Página principal del usuario (JSON con id, path, title e icon)';
COMMENT ON COLUMN user_preferences.favorite_pages IS 'Array de páginas favoritas (JSON con id, path, title e icon)';
