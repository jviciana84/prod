// Script simple para limpiar vehículos vendidos del stock
// Usa la configuración existente del proyecto

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (usar las variables del proyecto)
const supabaseUrl = 'https://your-project.supabase.co' // Reemplazar con la URL real
const supabaseKey = 'your-service-role-key' // Reemplazar con la clave real

// Para este script, vamos a usar una aproximación diferente
// Crear un script que se pueda ejecutar desde la aplicación Next.js

console.log('🚗 SCRIPT DE LIMPIEZA DE VEHÍCULOS VENDIDOS')
console.log('==========================================')
console.log('')
console.log('Este script necesita las credenciales de Supabase.')
console.log('Ejecutando desde la aplicación Next.js...')
console.log('')

// Función para identificar vehículos vendidos
async function identifySoldVehicles() {
  console.log('🔍 PASO 1: Identificando vehículos vendidos en stock...')
  
  // Query SQL para identificar el problema
  const query = `
    SELECT 
      'RESUMEN GENERAL' as info,
      COUNT(*) as total_vehiculos_stock,
      COUNT(CASE WHEN is_sold = true THEN 1 END) as vendidos_en_stock,
      COUNT(CASE WHEN is_sold = false OR is_sold IS NULL THEN 1 END) as disponibles_en_stock,
      COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as entregados_en_stock
    FROM stock;
    
    SELECT 
      'PROBLEMA: VENDIDOS EN STOCK' as info,
      s.id,
      s.license_plate,
      s.model,
      s.is_sold,
      s.estado,
      s.created_at,
      s.updated_at
    FROM stock s
    WHERE s.is_sold = true 
      AND s.estado != 'entregado'
    ORDER BY s.updated_at DESC
    LIMIT 10;
  `
  
  console.log('📋 Query SQL para identificar:')
  console.log(query)
  console.log('')
  
  return query
}

// Función para limpiar vehículos vendidos
async function cleanupSoldVehicles() {
  console.log('🧹 PASO 2: Script de limpieza...')
  
  const cleanupQuery = `
    -- Crear tabla temporal con vehículos a procesar
    CREATE TEMP TABLE temp_sold_vehicles AS
    SELECT 
        s.id,
        s.license_plate,
        s.model,
        s.is_sold,
        s.estado,
        s.created_at,
        s.updated_at,
        sv.id as sales_id,
        sv.sale_date,
        sv.advisor,
        e.id as entrega_id,
        e.fecha_entrega,
        e.asesor
    FROM stock s
    LEFT JOIN sales_vehicles sv ON s.license_plate = sv.license_plate
    LEFT JOIN entregas e ON s.license_plate = e.matricula
    WHERE s.is_sold = true 
      AND s.estado != 'entregado';

    -- Actualizar vehículos con fecha de entrega existente
    UPDATE stock 
    SET 
        estado = 'entregado',
        fecha_entrega = temp.fecha_entrega,
        updated_at = NOW()
    FROM temp_sold_vehicles temp
    WHERE stock.id = temp.id 
      AND temp.entrega_id IS NOT NULL;

    -- Actualizar vehículos con solo venta
    UPDATE stock 
    SET 
        estado = 'entregado',
        fecha_entrega = temp.sale_date,
        updated_at = NOW()
    FROM temp_sold_vehicles temp
    WHERE stock.id = temp.id 
      AND temp.entrega_id IS NULL 
      AND temp.sales_id IS NOT NULL;

    -- Actualizar vehículos sin venta ni entrega
    UPDATE stock 
    SET 
        estado = 'entregado',
        fecha_entrega = NOW(),
        updated_at = NOW()
    FROM temp_sold_vehicles temp
    WHERE stock.id = temp.id 
      AND temp.entrega_id IS NULL 
      AND temp.sales_id IS NULL;

    -- Limpiar tabla temporal
    DROP TABLE temp_sold_vehicles;
  `
  
  console.log('📋 Query SQL para limpiar:')
  console.log(cleanupQuery)
  console.log('')
  
  return cleanupQuery
}

// Función para verificar resultado
async function verifyCleanup() {
  console.log('🔍 PASO 3: Script de verificación...')
  
  const verifyQuery = `
    -- Verificar que no quedan vendidos en stock
    SELECT 
        'VERIFICACIÓN PRINCIPAL' as info,
        COUNT(*) as vendidos_que_quedan_en_stock
    FROM stock
    WHERE is_sold = true AND estado != 'entregado';

    -- Resumen final
    SELECT 
        'RESUMEN FINAL STOCK' as info,
        COUNT(*) as total_vehiculos,
        COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as entregados,
        COUNT(CASE WHEN estado != 'entregado' THEN 1 END) as en_stock,
        COUNT(CASE WHEN is_sold = true THEN 1 END) as marcados_vendidos,
        COUNT(CASE WHEN is_sold = false OR is_sold IS NULL THEN 1 END) as marcados_disponibles
    FROM stock;
  `
  
  console.log('📋 Query SQL para verificar:')
  console.log(verifyQuery)
  console.log('')
  
  return verifyQuery
}

// Ejecutar funciones
async function main() {
  console.log('📝 GENERANDO SCRIPTS SQL...')
  console.log('')
  
  const identifyQuery = await identifySoldVehicles()
  const cleanupQuery = await cleanupSoldVehicles()
  const verifyQuery = await verifyCleanup()
  
  console.log('✅ SCRIPTS GENERADOS')
  console.log('')
  console.log('📋 INSTRUCCIONES:')
  console.log('1. Ejecuta el script de identificación en Supabase SQL Editor')
  console.log('2. Revisa los resultados')
  console.log('3. Ejecuta el script de limpieza')
  console.log('4. Ejecuta el script de verificación')
  console.log('')
  console.log('🔧 Los scripts están listos para ejecutar en Supabase')
}

main().catch(console.error)
