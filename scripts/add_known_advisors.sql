-- Script para añadir asesores conocidos
-- IMPORTANTE: Los usuarios deben existir primero en auth.users

-- Verificar qué usuarios existen
SELECT 'Usuarios existentes en auth.users:' as info;
SELECT email, created_at FROM auth.users ORDER BY email;

-- Ejemplo de cómo añadir asesores (descomenta y modifica según tus datos reales)
/*
SELECT add_sales_advisor('javier.capellino@motormadrid.com', 'Javier Capellino', 'Javi');
SELECT add_sales_advisor('maria.garcia@motormadrid.com', 'María García', 'María');
SELECT add_sales_advisor('carlos.lopez@motormadrid.com', 'Carlos López', 'Carlos');
*/

-- Para ver los asesores actuales
SELECT * FROM list_sales_advisors();
