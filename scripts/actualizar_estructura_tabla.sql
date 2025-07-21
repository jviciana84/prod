-- SCRIPT PARA ACTUALIZAR ESTRUCTURA DE TABLA KEY_DOCUMENT_REQUESTS
-- Elimina las columnas relacionadas con emails que ya no son necesarias

-- 1. Eliminar restricciones NOT NULL de columnas de email
ALTER TABLE key_document_requests 
ALTER COLUMN email_subject DROP NOT NULL;

ALTER TABLE key_document_requests 
ALTER COLUMN email_body DROP NOT NULL;

-- 2. Opcional: Eliminar las columnas de email completamente (descomenta si quieres)
-- ALTER TABLE key_document_requests DROP COLUMN email_subject;
-- ALTER TABLE key_document_requests DROP COLUMN email_body;

-- 3. Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'key_document_requests' 
ORDER BY ordinal_position;

-- 4. Mostrar mensaje de confirmación
SELECT 'ESTRUCTURA DE TABLA ACTUALIZADA - Columnas de email ahora permiten NULL' as estado; 