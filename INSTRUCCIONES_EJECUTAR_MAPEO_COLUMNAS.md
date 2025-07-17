# Instrucciones para Ejecutar el Script de Mapeo de Columnas

## Paso 1: Acceder a Supabase
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a la sección **"SQL Editor"** en el menú lateral

## Paso 2: Ejecutar el Script
1. Haz clic en **"New query"** o **"Nueva consulta"**
2. Copia y pega el siguiente script completo:

```sql
-- Script para crear la tabla de mapeo de columnas
-- Ejecutar este script en Supabase SQL Editor

-- Crear tabla de mapeos de columnas
CREATE TABLE IF NOT EXISTS public.column_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información básica del mapeo
    name VARCHAR(100) NOT NULL,
    duc_scraper_column VARCHAR(100) NOT NULL,
    nuevas_entradas_column VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Regla de transformación opcional
    transformation_rule TEXT, -- SQL para transformar el valor
    
    -- Metadatos
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_column_mappings_is_active ON public.column_mappings(is_active);
CREATE INDEX IF NOT EXISTS idx_column_mappings_duc_column ON public.column_mappings(duc_scraper_column);
CREATE INDEX IF NOT EXISTS idx_column_mappings_nuevas_column ON public.column_mappings(nuevas_entradas_column);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_column_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_column_mappings_updated_at
    BEFORE UPDATE ON public.column_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_column_mappings_updated_at();

-- Habilitar RLS
ALTER TABLE public.column_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora)
CREATE POLICY "Allow all operations on column_mappings" ON public.column_mappings FOR ALL USING (true);

-- Insertar algunos mapeos por defecto
INSERT INTO public.column_mappings (name, duc_scraper_column, nuevas_entradas_column, is_active) VALUES
('Matrícula', 'Matrícula', 'license_plate', true),
('Modelo', 'Modelo', 'model', true),
('Marca', 'Marca', 'model', true),
('Fecha entrada VO', 'Fecha entrada VO', 'reception_date', true),
('Fecha compra DMS', 'Fecha compra DMS', 'entry_date', true)
ON CONFLICT (duc_scraper_column, nuevas_entradas_column) DO NOTHING;

-- Comentarios para documentar
COMMENT ON TABLE public.column_mappings IS 'Mapeos de columnas entre duc_scraper y nuevas_entradas';
COMMENT ON COLUMN public.column_mappings.duc_scraper_column IS 'Nombre de la columna en duc_scraper';
COMMENT ON COLUMN public.column_mappings.nuevas_entradas_column IS 'Nombre de la columna en nuevas_entradas';
COMMENT ON COLUMN public.column_mappings.transformation_rule IS 'Regla SQL para transformar el valor antes de insertarlo';

-- Verificar que se creó correctamente
SELECT 'column_mappings' as table_name, COUNT(*) as row_count FROM public.column_mappings;
```

3. Haz clic en **"Run"** o **"Ejecutar"**

## Paso 3: Verificar la Ejecución
Deberías ver un resultado como:
```
table_name        | row_count
------------------|----------
column_mappings   | 5
```

## Paso 4: Acceder a la Página de Mapeo
1. Ve a tu aplicación
2. Navega a **Administración** → **"Mapeo de Columnas DUC"**
3. Ya puedes configurar los mapeos de columnas

## ¿Qué hace este script?

### ✅ Crea la tabla `column_mappings` con:
- **id**: Identificador único
- **name**: Nombre descriptivo del mapeo
- **duc_scraper_column**: Columna de origen en duc_scraper
- **nuevas_entradas_column**: Columna de destino en nuevas_entradas
- **is_active**: Estado activo/inactivo
- **transformation_rule**: Regla SQL opcional para transformar valores
- **created_by**: Usuario que creó el mapeo
- **created_at/updated_at**: Timestamps automáticos

### ✅ Configura:
- **Índices** para mejor rendimiento
- **Trigger** para actualizar automáticamente `updated_at`
- **RLS** (Row Level Security) habilitado
- **Políticas** de acceso
- **Mapeos por defecto** iniciales

### ✅ Mapeos iniciales:
- `Matrícula` → `license_plate`
- `Modelo` → `model`
- `Marca` → `model`
- `Fecha entrada VO` → `reception_date`
- `Fecha compra DMS` → `entry_date`

## Nota Importante
Si ves algún error, asegúrate de que:
1. Tienes permisos de administrador en Supabase
2. La extensión `uuid-ossp` está habilitada (normalmente lo está por defecto)
3. No hay conflictos con tablas existentes

¡Una vez ejecutado, ya puedes usar la página de mapeo de columnas! 