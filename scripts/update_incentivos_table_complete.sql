-- Script completo para asegurar que la tabla incentivos tiene todas las columnas necesarias

-- Añadir columnas que podrían faltar
ALTER TABLE incentivos 
ADD COLUMN IF NOT EXISTS otros_observaciones TEXT,
ADD COLUMN IF NOT EXISTS precio_compra DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(100),
ADD COLUMN IF NOT EXISTS importe_antiguedad DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS importe_financiado DECIMAL(10,2) DEFAULT 0;

-- Añadir comentarios para documentar las columnas
COMMENT ON COLUMN incentivos.otros_observaciones IS 'Observaciones para justificar importes adicionales';
COMMENT ON COLUMN incentivos.precio_compra IS 'Precio de compra del vehículo de la tabla nuevas_entradas';
COMMENT ON COLUMN incentivos.dias_stock IS 'Días entre fecha de compra y fecha de venta';
COMMENT ON COLUMN incentivos.forma_pago IS 'Forma de pago de la venta';
COMMENT ON COLUMN incentivos.importe_antiguedad IS 'Importe por incentivo de antigüedad';
COMMENT ON COLUMN incentivos.importe_financiado IS 'Importe por incentivo de financiación';

-- Verificar la estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incentivos' 
ORDER BY ordinal_position;
