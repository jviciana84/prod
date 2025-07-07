-- Eliminar directamente las columnas no deseadas de la tabla stock
ALTER TABLE stock 
DROP COLUMN IF EXISTS asesor,
DROP COLUMN IF EXISTS forma_pago,
DROP COLUMN IF EXISTS estado_pago,
DROP COLUMN IF EXISTS validado,
DROP COLUMN IF EXISTS centro_trabajo;
