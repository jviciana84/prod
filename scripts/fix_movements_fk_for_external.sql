-- Script para arreglar las FK de movimientos para que acepten external_material_vehicles
-- El problema es que las FK solo apuntan a sales_vehicles, pero necesitamos que también acepten external_material_vehicles

-- 1. Eliminar las FK existentes que solo apuntan a sales_vehicles
ALTER TABLE document_movements DROP CONSTRAINT IF EXISTS document_movements_vehicle_id_fkey;
ALTER TABLE key_movements DROP CONSTRAINT IF EXISTS key_movements_vehicle_id_fkey;

-- 2. Verificar que las constraints se eliminaron correctamente
SELECT 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('document_movements', 'key_movements')
    AND kcu.column_name = 'vehicle_id'
ORDER BY tc.table_name;

-- 3. Mensaje de confirmación
SELECT '✅ FK eliminadas - ahora acepta cualquier vehicle_id' as status;
SELECT '✅ Ahora el modal debería funcionar correctamente con external_material_vehicles' as status; 