-- Script para copiar los objetivos de 2025 a años futuros (hasta 2030)

DO $$
DECLARE
    current_year INTEGER := 2026;
    end_year INTEGER := 2030;
    sales_obj RECORD;
    financial_obj RECORD;
BEGIN
    -- Copiar objetivos de ventas trimestrales (sales_quarterly_objectives)
    FOR sales_obj IN
        SELECT concesionario, marca, periodo_label, objetivo
        FROM public.sales_quarterly_objectives
        WHERE año = 2025
    LOOP
        FOR current_year IN 2026..end_year
        LOOP
            INSERT INTO public.sales_quarterly_objectives (concesionario, marca, periodo_label, año, objetivo)
            VALUES (sales_obj.concesionario, sales_obj.marca, sales_obj.periodo_label, current_year, sales_obj.objetivo)
            ON CONFLICT (concesionario, marca, periodo_label, año) DO UPDATE SET
                objetivo = EXCLUDED.objetivo,
                updated_at = NOW();
        END LOOP;
    END LOOP;

    -- Copiar objetivos de penetración financiera (financial_penetration_objectives)
    FOR financial_obj IN
        SELECT concesionario, objetivo_porcentaje
        FROM public.financial_penetration_objectives
        WHERE año = 2025
    LOOP
        FOR current_year IN 2026..end_year
        LOOP
            INSERT INTO public.financial_penetration_objectives (concesionario, año, objetivo_porcentaje)
            VALUES (financial_obj.concesionario, current_year, financial_obj.objetivo_porcentaje)
            ON CONFLICT (concesionario, año) DO UPDATE SET
                objetivo_porcentaje = EXCLUDED.objetivo_porcentaje,
                updated_at = NOW();
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Objetivos de 2025 copiados a años futuros hasta %.', end_year;

END $$;

-- Opcional: Verificar los datos insertados para un año específico (ej. 2026)
SELECT * FROM public.sales_quarterly_objectives WHERE año = 2026;
SELECT * FROM public.financial_penetration_objectives WHERE año = 2026;
