-- =====================================================
-- AÑADIR CAMPOS FALTANTES A NUEVAS_ENTRADAS
-- =====================================================
-- Descripción: Añadir campos de compra, origen y gasto que faltan
-- =====================================================

-- Añadir campos faltantes a nuevas_entradas
ALTER TABLE public.nuevas_entradas 
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12, 2), -- Precio de compra
ADD COLUMN IF NOT EXISTS origin VARCHAR(100), -- Origen del vehículo
ADD COLUMN IF NOT EXISTS origin_details TEXT, -- Detalles del origen
ADD COLUMN IF NOT EXISTS purchase_date_duc TIMESTAMP WITH TIME ZONE, -- Fecha de compra del DUC
ADD COLUMN IF NOT EXISTS duc_id_anuncio TEXT, -- ID Anuncio del DUC para tracking
ADD COLUMN IF NOT EXISTS duc_import_date TIMESTAMP WITH TIME ZONE, -- Fecha de importación del DUC
ADD COLUMN IF NOT EXISTS duc_last_seen TIMESTAMP WITH TIME ZONE; -- Última vez visto en DUC

-- Crear índices para los nuevos campos importantes
CREATE INDEX IF NOT EXISTS idx_nuevas_entradas_purchase_price ON public.nuevas_entradas(purchase_price);
CREATE INDEX IF NOT EXISTS idx_nuevas_entradas_origin ON public.nuevas_entradas(origin);
CREATE INDEX IF NOT EXISTS idx_nuevas_entradas_duc_id_anuncio ON public.nuevas_entradas(duc_id_anuncio);
CREATE INDEX IF NOT EXISTS idx_nuevas_entradas_duc_import_date ON public.nuevas_entradas(duc_import_date);

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN public.nuevas_entradas.purchase_price IS 'Precio de compra del vehículo (desde DUC)';
COMMENT ON COLUMN public.nuevas_entradas.origin IS 'Origen del vehículo (desde DUC)';
COMMENT ON COLUMN public.nuevas_entradas.origin_details IS 'Detalles adicionales del origen';
COMMENT ON COLUMN public.nuevas_entradas.purchase_date_duc IS 'Fecha de compra según DUC';
COMMENT ON COLUMN public.nuevas_entradas.duc_id_anuncio IS 'ID Anuncio del DUC para tracking';
COMMENT ON COLUMN public.nuevas_entradas.duc_import_date IS 'Fecha de importación desde DUC';
COMMENT ON COLUMN public.nuevas_entradas.duc_last_seen IS 'Última vez que apareció en DUC';

-- Verificar que los campos se han añadido correctamente
SELECT 
    'CAMPOS AÑADIDOS' as estado,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
AND table_schema = 'public'
AND column_name IN ('purchase_price', 'origin', 'origin_details', 'purchase_date_duc', 'duc_id_anuncio', 'duc_import_date', 'duc_last_seen')
ORDER BY column_name;

-- Mostrar el total de columnas después de la actualización
SELECT 
    'TOTAL COLUMNAS NUEVAS_ENTRADAS' as tipo,
    COUNT(*) as cantidad
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas' 
AND table_schema = 'public'; 