-- Script para depurar y verificar el funcionamiento del trigger

-- 1. Verificar la estructura de la tabla nuevas_entradas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nuevas_entradas'
ORDER BY ordinal_position;

-- 2. Verificar la estructura de la tabla stock
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stock'
ORDER BY ordinal_position;

-- 3. Verificar si el trigger existe
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname = 'nuevas_entradas_to_stock_trigger';

-- 4. Verificar la función del trigger
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'nuevas_entradas_to_stock';

-- 5. Verificar datos de ejemplo en nuevas_entradas
SELECT id, license_plate, model, is_received, reception_date, expense_charge
FROM nuevas_entradas
LIMIT 10;

-- 6. Verificar datos de ejemplo en stock
SELECT id, license_plate, model, reception_date, expense_charge
FROM stock
LIMIT 10;

-- 7. Probar el trigger manualmente con una actualización
-- (Descomenta y ajusta según sea necesario)
/*
UPDATE nuevas_entradas
SET is_received = TRUE, 
    reception_date = NOW(),
    expense_charge = 'TEST CARGO'
WHERE license_plate = 'MATRÍCULA_DE_PRUEBA' AND is_received = FALSE;

-- Verificar si se actualizó en stock
SELECT * FROM stock WHERE license_plate = 'MATRÍCULA_DE_PRUEBA';
*/
