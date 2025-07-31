-- =====================================================
-- ARREGLAR MANUALMENTE EL CASO 8601JTB
-- =====================================================
-- Descripción: El vehículo 8601JTB está como "RESERVADO" en el CSV
-- pero no se movió automáticamente a vendido. Lo arreglamos manualmente.
-- =====================================================

-- 1. VERIFICAR ESTADO ACTUAL
SELECT 'ESTADO ACTUAL' as info;
SELECT 'DUC_SCRAPER' as tabla, "Disponibilidad" FROM duc_scraper WHERE "Matrícula" = '8601JTB';
SELECT 'STOCK' as tabla, mechanical_status, body_status FROM stock WHERE license_plate = '8601JTB';
SELECT 'FOTOS' as tabla, photos_completed, estado_pintura FROM fotos WHERE license_plate = '8601JTB';

-- 2. EJECUTAR MANUALMENTE LA FUNCIÓN PARA ESTE VEHÍCULO
-- Simular el cambio de "Disponible" a "Reservado" para activar el trigger
UPDATE duc_scraper 
SET "Disponibilidad" = 'Disponible' 
WHERE "Matrícula" = '8601JTB';

-- Ahora cambiar a "Reservado" para activar el trigger
UPDATE duc_scraper 
SET "Disponibilidad" = 'RESERVADO' 
WHERE "Matrícula" = '8601JTB';

-- 3. VERIFICAR QUE SE APLICÓ EL CAMBIO
SELECT 'DESPUÉS DEL CAMBIO' as info;
SELECT 'DUC_SCRAPER' as tabla, "Disponibilidad" FROM duc_scraper WHERE "Matrícula" = '8601JTB';
SELECT 'STOCK' as tabla, mechanical_status, body_status FROM stock WHERE license_plate = '8601JTB';
SELECT 'FOTOS' as tabla, photos_completed, estado_pintura FROM fotos WHERE license_plate = '8601JTB';

-- 4. VERIFICAR QUE SE CREÓ EN SALES_VEHICLES
SELECT 'SALES_VEHICLES' as tabla, license_plate, sale_date, advisor_name FROM sales_vehicles WHERE license_plate = '8601JTB';

-- 5. VERIFICAR QUE SE CREÓ EN VEHICLE_SALE_STATUS
SELECT 'VEHICLE_SALE_STATUS' as tabla, license_plate, sale_status FROM vehicle_sale_status WHERE license_plate = '8601JTB'; 