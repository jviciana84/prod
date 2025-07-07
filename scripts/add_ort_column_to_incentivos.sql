-- Script para añadir la columna 'ort' a la tabla 'incentivos'
-- Esta columna se utilizará para almacenar el código ORT asociado a cada incentivo.

ALTER TABLE public.incentivos
ADD COLUMN ort TEXT;

-- Opcional: Si necesitas que los valores existentes de 'or' (si los hubiera en otra columna)
-- se migren a 'ort', necesitarías un script de migración de datos adicional.
-- Por ahora, solo creamos la columna.

-- Opcional: Si quieres añadir un índice para búsquedas más rápidas por ORT
-- CREATE INDEX idx_incentivos_ort ON public.incentivos (ort);
