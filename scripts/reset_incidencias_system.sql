-- Script para resetear completamente el sistema de incidencias

-- 1. Eliminar la tabla de historial de incidencias
DROP TABLE IF EXISTS incidencias_historial CASCADE;

-- 2. Limpiar las columnas de incidencias en la tabla entregas
UPDATE entregas 
SET 
  tipos_incidencia = NULL,
  incidencia = false,
  estados_incidencia = NULL
WHERE tipos_incidencia IS NOT NULL 
   OR incidencia = true 
   OR estados_incidencia IS NOT NULL;

-- 3. Verificar que se limpiaron correctamente
SELECT 
  COUNT(*) as total_entregas,
  COUNT(CASE WHEN tipos_incidencia IS NOT NULL THEN 1 END) as con_tipos_incidencia,
  COUNT(CASE WHEN incidencia = true THEN 1 END) as con_incidencia_true,
  COUNT(CASE WHEN estados_incidencia IS NOT NULL THEN 1 END) as con_estados_incidencia
FROM entregas;

-- 4. Recrear la tabla de historial de incidencias con estructura limpia
CREATE TABLE incidencias_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula TEXT NOT NULL,
  tipo_incidencia TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('añadida', 'eliminada')),
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nombre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear índices para mejorar el rendimiento
CREATE INDEX idx_incidencias_historial_matricula ON incidencias_historial(matricula);
CREATE INDEX idx_incidencias_historial_tipo ON incidencias_historial(tipo_incidencia);
CREATE INDEX idx_incidencias_historial_accion ON incidencias_historial(accion);
CREATE INDEX idx_incidencias_historial_created_at ON incidencias_historial(created_at);

-- 6. Habilitar RLS
ALTER TABLE incidencias_historial ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas de seguridad
CREATE POLICY "Usuarios autenticados pueden leer incidencias_historial"
  ON incidencias_historial FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar incidencias_historial"
  ON incidencias_historial FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar incidencias_historial"
  ON incidencias_historial FOR UPDATE
  TO authenticated
  USING (true);

-- 8. Crear función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION registrar_cambio_incidencia()
RETURNS TRIGGER AS $$
DECLARE
  tipo_incidencia TEXT;
  usuario_id UUID;
  usuario_nombre TEXT;
  old_tipos TEXT[] := COALESCE(OLD.tipos_incidencia, ARRAY[]::text[]);
  new_tipos TEXT[] := COALESCE(NEW.tipos_incidencia, ARRAY[]::text[]);
BEGIN
  -- Obtener información del usuario
  usuario_id := auth.uid();
  SELECT email INTO usuario_nombre FROM auth.users WHERE id = usuario_id;
  
  -- Solo procesar si hay cambios en tipos_incidencia
  IF TG_OP = 'UPDATE' AND old_tipos IS DISTINCT FROM new_tipos THEN
    
    -- Incidencias añadidas (están en NEW pero no en OLD)
    FOREACH tipo_incidencia IN ARRAY (
      SELECT unnest(new_tipos) 
      EXCEPT 
      SELECT unnest(old_tipos)
    )
    LOOP
      INSERT INTO incidencias_historial (
        matricula, tipo_incidencia, accion, usuario_id, usuario_nombre
      ) VALUES (
        NEW.matricula, tipo_incidencia, 'añadida', usuario_id, COALESCE(usuario_nombre, 'Sistema')
      );
    END LOOP;
    
    -- Incidencias eliminadas (están en OLD pero no en NEW)
    FOREACH tipo_incidencia IN ARRAY (
      SELECT unnest(old_tipos) 
      EXCEPT 
      SELECT unnest(new_tipos)
    )
    LOOP
      INSERT INTO incidencias_historial (
        matricula, tipo_incidencia, accion, usuario_id, usuario_nombre
      ) VALUES (
        NEW.matricula, tipo_incidencia, 'eliminada', usuario_id, COALESCE(usuario_nombre, 'Sistema')
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear el trigger
DROP TRIGGER IF EXISTS trigger_registrar_cambio_incidencia ON entregas;
CREATE TRIGGER trigger_registrar_cambio_incidencia
  AFTER UPDATE ON entregas
  FOR EACH ROW
  EXECUTE FUNCTION registrar_cambio_incidencia();

-- 10. Mostrar resumen final
SELECT 'Sistema de incidencias reseteado correctamente' as mensaje;
