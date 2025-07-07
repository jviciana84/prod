-- Función para crear la tabla incidencias_historial si no existe
CREATE OR REPLACE FUNCTION create_incidencias_historial_table()
RETURNS void AS $$
BEGIN
  -- Crear la tabla si no existe
  CREATE TABLE IF NOT EXISTS incidencias_historial (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    matricula TEXT NOT NULL,
    tipo_incidencia TEXT NOT NULL,
    accion TEXT NOT NULL CHECK (accion IN ('añadida', 'eliminada')),
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Crear índices para mejorar el rendimiento
  CREATE INDEX IF NOT EXISTS idx_incidencias_historial_matricula ON incidencias_historial(matricula);
  CREATE INDEX IF NOT EXISTS idx_incidencias_historial_tipo ON incidencias_historial(tipo_incidencia);
  CREATE INDEX IF NOT EXISTS idx_incidencias_historial_accion ON incidencias_historial(accion);
  CREATE INDEX IF NOT EXISTS idx_incidencias_historial_created_at ON incidencias_historial(created_at);

  -- Habilitar RLS
  ALTER TABLE incidencias_historial ENABLE ROW LEVEL SECURITY;

  -- Crear política para permitir lectura a usuarios autenticados
  DROP POLICY IF EXISTS "Usuarios autenticados pueden leer incidencias_historial" ON incidencias_historial;
  CREATE POLICY "Usuarios autenticados pueden leer incidencias_historial"
    ON incidencias_historial FOR SELECT
    TO authenticated
    USING (true);

  -- Crear política para permitir inserción a usuarios autenticados
  DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar incidencias_historial" ON incidencias_historial;
  CREATE POLICY "Usuarios autenticados pueden insertar incidencias_historial"
    ON incidencias_historial FOR INSERT
    TO authenticated
    WITH CHECK (true);

  -- Crear política para permitir actualización a usuarios autenticados
  DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar incidencias_historial" ON incidencias_historial;
  CREATE POLICY "Usuarios autenticados pueden actualizar incidencias_historial"
    ON incidencias_historial FOR UPDATE
    TO authenticated
    USING (true);

END;
$$ LANGUAGE plpgsql;
