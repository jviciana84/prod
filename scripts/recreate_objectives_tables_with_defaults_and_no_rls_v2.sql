-- scripts/recreate_objectives_tables_with_defaults_and_no_rls_v2.sql

-- Paso 1: Eliminar las tablas existentes si existen para asegurar una recreación limpia
DROP TABLE IF EXISTS public.sales_quarterly_objectives CASCADE;
DROP TABLE IF EXISTS public.financial_penetration_objectives CASCADE;

-- Paso 2: Recrear la tabla sales_quarterly_objectives con ID UUID por defecto y clave primaria
CREATE TABLE public.sales_quarterly_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concesionario TEXT NOT NULL,
    marca TEXT NOT NULL,
    periodo_label TEXT NOT NULL,
    año INTEGER NOT NULL,
    objetivo INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (concesionario, marca, periodo_label, año)
);

-- Paso 3: Recrear la tabla financial_penetration_objectives con ID UUID por defecto y clave primaria
CREATE TABLE public.financial_penetration_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concesionario TEXT NOT NULL,
    año INTEGER NOT NULL,
    objetivo_porcentaje NUMERIC(5, 2) NOT NULL, -- Porcentaje con 2 decimales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (concesionario, año)
);

-- Paso 4: Deshabilitar Row Level Security (RLS) para ambas tablas
-- Esto es crucial si las políticas RLS están causando problemas de acceso o inserción.
ALTER TABLE public.sales_quarterly_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_penetration_objectives DISABLE ROW LEVEL SECURITY;

-- Paso 5: Crear funciones para actualizar 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Aplicar triggers para 'updated_at'
CREATE OR REPLACE TRIGGER set_sales_quarterly_objectives_updated_at
BEFORE UPDATE ON public.sales_quarterly_objectives
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_financial_penetration_objectives_updated_at
BEFORE UPDATE ON public.financial_penetration_objectives
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Paso 7: Verificar la estructura de las tablas y el estado de RLS
-- Esto te permitirá confirmar que los cambios se aplicaron correctamente.
SELECT
    cols.table_name,
    cols.column_name,
    cols.data_type,
    cols.is_nullable,
    cols.column_default,
    pg_class.relrowsecurity AS row_level_security_enabled -- Corregido: Acceso directo a relrowsecurity de pg_class
FROM
    information_schema.columns AS cols
JOIN
    pg_class ON pg_class.relname = cols.table_name
WHERE
    cols.table_schema = 'public'
    AND cols.table_name IN ('sales_quarterly_objectives', 'financial_penetration_objectives')
ORDER BY
    cols.table_name, ordinal_position;

-- Verificar políticas RLS explícitamente (debería estar vacío si RLS está deshabilitado)
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('sales_quarterly_objectives', 'financial_penetration_objectives');
