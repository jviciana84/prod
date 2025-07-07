-- Verificar si existe el registro en sales_vehicles para la matrícula de entregas
SELECT license_plate, model, advisor, price, purchase_price, payment_method, sale_date, registration_date
FROM sales_vehicles 
WHERE license_plate = '9640KNC';

-- También verificar si ya existe en incentivos
SELECT id, matricula, modelo, asesor, precio_venta, precio_compra, tramitado
FROM incentivos 
WHERE matricula = '9640KNC';
