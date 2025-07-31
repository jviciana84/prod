-- Buscar vehículo 6109NDG en stock
SELECT 
    license_plate, 
    model, 
    paint_status, 
    body_status, 
    mechanical_status, 
    is_sold, 
    reception_date, 
    inspection_date 
FROM stock 
WHERE license_plate = '6109NDG'; 