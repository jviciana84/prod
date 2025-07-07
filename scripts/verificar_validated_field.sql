-- Verificar el campo validated para el registro 0010NBB
SELECT 
    license_plate,
    cyp_status,
    photo_360_status,
    validated,
    CASE 
        WHEN validated IS TRUE THEN '✅ TRUE'
        WHEN validated IS FALSE THEN '❌ FALSE' 
        WHEN validated IS NULL THEN '⚠️ NULL'
        ELSE '❓ UNKNOWN'
    END as validated_status
FROM sales_vehicles 
WHERE license_plate = '0010NBB';
