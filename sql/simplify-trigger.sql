-- Esta función será llamada por la acción del servidor para simplificar el trigger
CREATE OR REPLACE FUNCTION simplify_auto_assignment_trigger()
RETURNS void AS $$
BEGIN
  -- Crear una versión simplificada de la función del trigger
  CREATE OR REPLACE FUNCTION auto_assign_photographer()
  RETURNS TRIGGER AS $func$
  DECLARE
    photographer_record RECORD;
    total_assigned INTEGER;
    current_assignments JSONB := '{}'::jsonb;
    best_photographer UUID := NULL;
    best_deficit NUMERIC := -1000;
  BEGIN
    -- Solo proceder si el nuevo registro no tiene fotógrafo asignado
    IF NEW.assigned_to IS NULL AND NEW.photos_completed IS FALSE THEN
      -- Obtener el total de vehículos asignados
      SELECT COUNT(*) INTO total_assigned FROM fotos WHERE assigned_to IS NOT NULL;
      
      -- Obtener asignaciones actuales por fotógrafo
      SELECT jsonb_object_agg(assigned_to, cnt) INTO current_assignments
      FROM (
        SELECT assigned_to, COUNT(*) as cnt
        FROM fotos
        WHERE assigned_to IS NOT NULL
        GROUP BY assigned_to
      ) AS counts;
      
      -- Si no hay asignaciones, inicializar
      IF current_assignments IS NULL THEN
        current_assignments := '{}'::jsonb;
      END IF;
      
      -- Encontrar el fotógrafo con mayor déficit
      FOR photographer_record IN 
        SELECT 
          user_id, 
          percentage
        FROM fotos_asignadas
        WHERE is_active = TRUE
        ORDER BY percentage DESC
      LOOP
        DECLARE
          current_count INTEGER := COALESCE((current_assignments->>photographer_record.user_id::text)::INTEGER, 0);
          target_count NUMERIC := (total_assigned + 1) * photographer_record.percentage / 100;
          deficit NUMERIC := target_count - current_count;
        BEGIN
          -- Si este fotógrafo tiene mayor déficit, seleccionarlo
          IF deficit > best_deficit THEN
            best_deficit := deficit;
            best_photographer := photographer_record.user_id;
          END IF;
        END;
      END LOOP;
      
      -- Asignar al mejor fotógrafo encontrado
      IF best_photographer IS NOT NULL THEN
        NEW.assigned_to := best_photographer;
        NEW.original_assigned_to := best_photographer;
      END IF;
    END IF;
    
    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql;

  -- Asegurarse de que el trigger existe
  DROP TRIGGER IF EXISTS assign_photographer_trigger ON fotos;
  CREATE TRIGGER assign_photographer_trigger
  BEFORE INSERT ON fotos
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_photographer();
END;
$$ LANGUAGE plpgsql;
