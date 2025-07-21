-- SCRIPT PARA RENOMBRAR TABLAS DOCUWARE A KEY_DOCUMENT_REQUESTS
-- Ejecutar después de la limpieza y antes de la migración

-- 1. Renombrar tabla principal
ALTER TABLE docuware_requests RENAME TO key_document_requests;

-- 2. Renombrar tabla de materiales
ALTER TABLE docuware_request_materials RENAME TO key_document_materials;

-- 3. Actualizar la foreign key en la tabla de materiales
ALTER TABLE key_document_materials 
DROP CONSTRAINT docuware_request_materials_docuware_request_id_fkey;

ALTER TABLE key_document_materials 
ADD CONSTRAINT key_document_materials_key_document_request_id_fkey 
FOREIGN KEY (docuware_request_id) REFERENCES key_document_requests(id) ON DELETE CASCADE;

-- 4. Renombrar la columna foreign key
ALTER TABLE key_document_materials 
RENAME COLUMN docuware_request_id TO key_document_request_id;

-- 5. Actualizar índices
DROP INDEX IF EXISTS idx_docuware_requests_status;
DROP INDEX IF EXISTS idx_docuware_requests_license_plate;
DROP INDEX IF EXISTS idx_docuware_requests_date;
DROP INDEX IF EXISTS idx_docuware_request_materials_request_id;
DROP INDEX IF EXISTS idx_docuware_request_materials_type;

CREATE INDEX idx_key_document_requests_status ON key_document_requests(status);
CREATE INDEX idx_key_document_requests_license_plate ON key_document_requests(license_plate);
CREATE INDEX idx_key_document_requests_date ON key_document_requests(request_date);
CREATE INDEX idx_key_document_materials_request_id ON key_document_materials(key_document_request_id);
CREATE INDEX idx_key_document_materials_type ON key_document_materials(material_type);

-- 6. Actualizar trigger de updated_at
DROP TRIGGER IF EXISTS trigger_update_docuware_requests_updated_at ON key_document_requests;

CREATE TRIGGER trigger_update_key_document_requests_updated_at
    BEFORE UPDATE ON key_document_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_docuware_requests_updated_at();

-- 7. Verificar que todo funciona
SELECT 
    'key_document_requests' as tabla,
    COUNT(*) as registros
FROM key_document_requests
UNION ALL
SELECT 
    'key_document_materials' as tabla,
    COUNT(*) as registros
FROM key_document_materials;

-- 8. Mensaje de confirmación
SELECT '✅ TABLAS RENOMBRADAS A KEY_DOCUMENT_REQUESTS CORRECTAMENTE' as estado; 