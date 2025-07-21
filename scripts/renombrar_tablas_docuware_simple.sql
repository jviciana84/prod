-- SCRIPT SIMPLIFICADO PARA RENOMBRAR TABLAS DOCUWARE
-- Ejecutar paso a paso en Supabase SQL Editor

-- PASO 1: Renombrar tabla principal
ALTER TABLE docuware_requests RENAME TO key_document_requests;

-- PASO 2: Renombrar tabla de materiales
ALTER TABLE docuware_request_materials RENAME TO key_document_materials;

-- PASO 3: Eliminar constraint anterior
ALTER TABLE key_document_materials 
DROP CONSTRAINT IF EXISTS docuware_request_materials_docuware_request_id_fkey;

-- PASO 4: Renombrar columna foreign key
ALTER TABLE key_document_materials 
RENAME COLUMN docuware_request_id TO key_document_request_id;

-- PASO 5: Crear nueva constraint
ALTER TABLE key_document_materials 
ADD CONSTRAINT key_document_materials_key_document_request_id_fkey 
FOREIGN KEY (key_document_request_id) REFERENCES key_document_requests(id) ON DELETE CASCADE;

-- PASO 6: Eliminar índices antiguos
DROP INDEX IF EXISTS idx_docuware_requests_status;
DROP INDEX IF EXISTS idx_docuware_requests_license_plate;
DROP INDEX IF EXISTS idx_docuware_requests_date;
DROP INDEX IF EXISTS idx_docuware_request_materials_request_id;
DROP INDEX IF EXISTS idx_docuware_request_materials_type;

-- PASO 7: Crear nuevos índices
CREATE INDEX idx_key_document_requests_status ON key_document_requests(status);
CREATE INDEX idx_key_document_requests_license_plate ON key_document_requests(license_plate);
CREATE INDEX idx_key_document_requests_date ON key_document_requests(request_date);
CREATE INDEX idx_key_document_materials_request_id ON key_document_materials(key_document_request_id);
CREATE INDEX idx_key_document_materials_type ON key_document_materials(material_type);

-- PASO 8: Eliminar trigger antiguo
DROP TRIGGER IF EXISTS trigger_update_docuware_requests_updated_at ON key_document_requests;

-- PASO 9: Crear nuevo trigger
CREATE TRIGGER trigger_update_key_document_requests_updated_at
    BEFORE UPDATE ON key_document_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_docuware_requests_updated_at();

-- PASO 10: Verificar resultado
SELECT 'key_document_requests' as tabla, COUNT(*) as registros FROM key_document_requests
UNION ALL
SELECT 'key_document_materials' as tabla, COUNT(*) as registros FROM key_document_materials;

-- PASO 11: Mensaje final
SELECT 'TABLAS RENOMBRADAS CORRECTAMENTE' as estado; 