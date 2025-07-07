-- Tabla para el historial de incidencias
CREATE TABLE IF NOT EXISTS incidencias_historial (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entrega_id UUID NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  tipo_incidencia TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('añadida', 'eliminada', 'resuelta')),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  usuario_nombre TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  comentario TEXT
);

-- Tabla para las notificaciones de incidencias
CREATE TABLE IF NOT EXISTS notificaciones_incidencia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entrega_id UUID NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
  tipo_incidencia TEXT NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leida BOOLEAN DEFAULT FALSE,
  destinatarios TEXT[] NOT NULL
);

-- Modificar la tabla de entregas para añadir el nuevo campo de estados de incidencia
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS estados_incidencia JSONB[];

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_incidencias_historial_entrega_id ON incidencias_historial(entrega_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_incidencia_entrega_id ON notificaciones_incidencia(entrega_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_incidencia_leida ON notificaciones_incidencia(leida);

-- Crear una función para registrar automáticamente los cambios en las incidencias
CREATE OR REPLACE FUNCTION registrar_cambio_incidencia()
RETURNS TRIGGER AS $$
DECLARE
  tipo_incidencia TEXT;
  accion TEXT;
  usuario_id UUID;
  usuario_nombre TEXT;
BEGIN
  -- Obtener el ID y nombre del usuario actual (esto dependerá de cómo manejes la autenticación)
  usuario_id := auth.uid();
  SELECT email INTO usuario_nombre FROM auth.users WHERE id = usuario_id;
  
  -- Si es una inserción o actualización con nuevas incidencias
  IF TG_OP = 'UPDATE' THEN
    -- Comparar los arrays de tipos_incidencia para determinar qué ha cambiado
    -- Esto es una simplificación, en la práctica necesitarías una lógica más compleja
    IF NEW.tipos_incidencia IS DISTINCT FROM OLD.tipos_incidencia THEN
      -- Para cada tipo de incidencia añadido
      FOREACH tipo_incidencia IN ARRAY (
        SELECT unnest(NEW.tipos_incidencia) 
        EXCEPT 
        SELECT unnest(COALESCE(OLD.tipos_incidencia, ARRAY[]::text[]))
      )
      LOOP
        INSERT INTO incidencias_historial (
          entrega_id, tipo_incidencia, accion, usuario_id, usuario_nombre
        ) VALUES (
          NEW.id, tipo_incidencia, 'añadida', usuario_id, usuario_nombre
        );
      END LOOP;
      
      -- Para cada tipo de incidencia eliminado
      FOREACH tipo_incidencia IN ARRAY (
        SELECT unnest(COALESCE(OLD.tipos_incidencia, ARRAY[]::text[])) 
        EXCEPT 
        SELECT unnest(NEW.tipos_incidencia)
      )
      LOOP
        INSERT INTO incidencias_historial (
          entrega_id, tipo_incidencia, accion, usuario_id, usuario_nombre
        ) VALUES (
          NEW.id, tipo_incidencia, 'eliminada', usuario_id, usuario_nombre
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger para la tabla de entregas
DROP TRIGGER IF EXISTS trigger_registrar_cambio_incidencia ON entregas;
CREATE TRIGGER trigger_registrar_cambio_incidencia
AFTER UPDATE ON entregas
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_incidencia();
