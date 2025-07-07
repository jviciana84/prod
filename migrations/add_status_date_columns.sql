-- Añadir columnas para fechas de estado
ALTER TABLE stock ADD COLUMN IF NOT EXISTS body_status_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE stock ADD COLUMN IF NOT EXISTS mechanical_status_date TIMESTAMP WITH TIME ZONE;
