-- Agregar columna movements_log a external_material_vehicles
ALTER TABLE external_material_vehicles 
ADD COLUMN IF NOT EXISTS movements_log TEXT DEFAULT '[]';

-- Comentario sobre el uso de la columna
COMMENT ON COLUMN external_material_vehicles.movements_log IS 'JSON array con el historial de movimientos de materiales para vehículos externos'; 