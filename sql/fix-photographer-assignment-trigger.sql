-- Script para corregir el trigger de asignación automática
-- Ejecutar en Supabase SQL Editor

-- Corregir la función auto_assign_photographer para distribución equitativa
CREATE OR REPLACE FUNCTION auto_assign_photographer()
RETURNS TRIGGER AS $func$
DECLARE
  photographer_record RECORD;
  total_assigned INTEGER;
  current_assignments JSONB := '{}'::jsonb;
  best_photographer UUID := NULL;
  best_deficit NUMERIC := -1000;
  total_vehicles INTEGER;
BEGIN
  -- Solo proceder si el nuevo registro no tiene fotógrafo asignado
  IF NEW.assigned_to IS NULL AND NEW.photos_completed IS FALSE THEN
    -- Obtener el total de vehículos asignados
    SELECT COUNT(*) INTO total_assigned FROM fotos WHERE assigned_to IS NOT NULL;
    total_vehicles := total_assigned + 1;
    
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
    
    -- Encontrar el fotógrafo con mayor déficit (distribución equitativa)
    FOR photographer_record IN 
      SELECT 
        user_id, 
        percentage
      FROM fotos_asignadas
      WHERE is_active = TRUE
      ORDER BY user_id -- Ordenar por ID para distribución equitativa
    LOOP
      DECLARE
        current_count INTEGER := COALESCE((current_assignments->>photographer_record.user_id::text)::INTEGER, 0);
        target_count NUMERIC := total_vehicles * photographer_record.percentage / 100;
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

-- Recrear el trigger
DROP TRIGGER IF EXISTS assign_photographer_trigger ON fotos;
CREATE TRIGGER assign_photographer_trigger
BEFORE INSERT ON fotos
FOR EACH ROW
EXECUTE FUNCTION auto_assign_photographer();

-- Función para asignar fotógrafos a vehículos existentes sin asignación
CREATE OR REPLACE FUNCTION assign_photographers_to_existing_vehicles()
RETURNS INTEGER AS $func$
DECLARE
  vehicle_record RECORD;
  photographer_record RECORD;
  total_assigned INTEGER;
  current_assignments JSONB := '{}'::jsonb;
  best_photographer UUID := NULL;
  best_deficit NUMERIC := -1000;
  total_vehicles INTEGER;
  assigned_count INTEGER := 0;
BEGIN
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
  
  -- Procesar cada vehículo sin asignación
  FOR vehicle_record IN 
    SELECT id, license_plate
    FROM fotos 
    WHERE assigned_to IS NULL AND photos_completed IS FALSE
  LOOP
    -- Encontrar el fotógrafo con mayor déficit
    best_photographer := NULL;
    best_deficit := -1000;
    
    FOR photographer_record IN 
      SELECT user_id, percentage
      FROM fotos_asignadas
      WHERE is_active = TRUE
      ORDER BY user_id
    LOOP
      DECLARE
        current_count INTEGER := COALESCE((current_assignments->>photographer_record.user_id::text)::INTEGER, 0);
        target_count NUMERIC := (total_assigned + assigned_count + 1) * photographer_record.percentage / 100;
        deficit NUMERIC := target_count - current_count;
      BEGIN
        IF deficit > best_deficit THEN
          best_deficit := deficit;
          best_photographer := photographer_record.user_id;
        END IF;
      END;
    END LOOP;
    
    -- Asignar al mejor fotógrafo encontrado
    IF best_photographer IS NOT NULL THEN
      UPDATE fotos 
      SET assigned_to = best_photographer, original_assigned_to = best_photographer
      WHERE id = vehicle_record.id;
      
      assigned_count := assigned_count + 1;
      
      -- Actualizar el contador de asignaciones
      current_assignments := jsonb_set(
        current_assignments, 
        ARRAY[best_photographer::text], 
        COALESCE((current_assignments->>best_photographer::text)::INTEGER, 0) + 1
      );
    END IF;
  END LOOP;
  
  RETURN assigned_count;
END;
$func$ LANGUAGE plpgsql; 