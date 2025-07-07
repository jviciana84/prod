-- Paso 1: Asegurarse de que el vehículo no esté en estado 'completado'
-- Esto es crucial para que el trigger detecte un CAMBIO en el siguiente UPDATE.
-- Si la columna 'validated' es BOOLEAN, usa FALSE. Si es TEXT, usa 'false'.
-- Basado en el trigger, parece ser TEXT ('true'/'false').
UPDATE public.sales_vehicles
SET
    cyp_status = 'pendiente',
    photo_360_status = 'pendiente',
    validated = 'false', -- Asegúrate de que sea 'false' como string si la columna es TEXT
    updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Mensaje de depuración para confirmar el reset
SELECT '✅ Estado de 0010NBB reseteado a pendiente.' as status;

-- Paso 2: Ahora, actualiza el vehículo a 'completado' para activar el trigger.
-- Este UPDATE debería generar un CAMBIO en cyp_status de 'pendiente' a 'completado',
-- lo que activará la condición del trigger.
UPDATE public.sales_vehicles
SET
    cyp_status = 'completado',
    photo_360_status = 'completado',
    validated = 'true', -- Asegúrate de que sea 'true' como string si la columna es TEXT
    updated_at = NOW()
WHERE license_plate = '0010NBB';

-- Mensaje de depuración para confirmar el intento de activación
SELECT '🚀 Intento de activar trigger para 0010NBB.' as status;

-- Paso 3: Verificar la tabla 'entregas' para ver si el trigger funcionó.
SELECT
    fecha_venta,
    fecha_entrega,
    matricula,
    modelo,
    asesor,
    "or",
    incidencia,
    observaciones,
    created_at,
    updated_at
FROM public.entregas
WHERE matricula = '0010NBB';
