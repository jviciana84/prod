-- Insertar objetivos de ventas trimestrales para 2025 Q2
INSERT INTO public.sales_quarterly_objectives (concesionario, marca, periodo_label, año, objetivo)
VALUES
    ('Motor Munich', 'BMW', 'Q2', 2025, 150),
    ('Motor Munich', 'MINI', 'Q2', 2025, 50),
    ('Motor Munich Cadí', 'BMW', 'Q2', 2025, 80),
    ('Motor Munich Cadí', 'MINI', 'Q2', 2025, 30)
ON CONFLICT (concesionario, marca, periodo_label, año) DO UPDATE SET
    objetivo = EXCLUDED.objetivo,
    updated_at = now();

-- Insertar objetivos de penetración financiera para 2025 (asumiendo que son anuales)
-- Si ya existen para 2025, se actualizarán. Si no, se insertarán.
INSERT INTO public.financial_penetration_objectives (concesionario, año, objetivo_porcentaje)
VALUES
    ('Motor Munich', 2025, 65.0),
    ('Motor Munich Cadí', 2025, 70.0)
ON CONFLICT (concesionario, año) DO UPDATE SET
    objetivo_porcentaje = EXCLUDED.objetivo_porcentaje,
    updated_at = now();

-- Opcional: Verificar los datos insertados
SELECT * FROM public.sales_quarterly_objectives WHERE año = 2025 AND periodo_label = 'Q2';
SELECT * FROM public.financial_penetration_objectives WHERE año = 2025;
