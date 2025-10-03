// Script directo para probar la conexión a Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno manualmente
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          process.env[key.trim()] = value
        }
      }
    })
  }
}

// Cargar variables de entorno
loadEnvFile()

async function testConnection() {
  console.log('🔍 Probando conexión directa a Supabase...')
  
  // Usar las variables de entorno del proyecto
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('📋 Variables de entorno:')
  console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada')
  console.log('   SUPABASE_KEY:', supabaseKey ? '✅ Configurada' : '❌ No configurada')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno no configuradas')
    return
  }
  
  try {
    // Crear cliente
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Cliente de Supabase creado')
    
    // Probar conexión simple
    console.log('🔍 Probando consulta simple...')
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error de conexión:', error)
      return
    }
    
    console.log('✅ Conexión exitosa!')
    console.log('📊 Datos obtenidos:', data?.length || 0, 'registros')
    
    if (data && data.length > 0) {
      console.log('📋 Estructura de la tabla stock:')
      const sample = data[0]
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${sample[key]}`)
      })
    }
    
    // Probar consulta de vehículos vendidos
    console.log('🔍 Probando consulta de vehículos vendidos...')
    const { data: soldVehicles, error: soldError } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold')
      .eq('is_sold', true)
      .limit(5)
    
    if (soldError) {
      console.error('❌ Error consultando vehículos vendidos:', soldError)
      return
    }
    
    console.log('✅ Consulta de vehículos vendidos exitosa!')
    console.log('🚨 Vehículos vendidos en stock:', soldVehicles?.length || 0)
    
    if (soldVehicles && soldVehicles.length > 0) {
      console.log('📋 Vehículos vendidos que necesitan limpieza:')
      soldVehicles.forEach((vehicle, index) => {
        console.log(`   ${index + 1}. ${vehicle.license_plate} - ${vehicle.model} - Vendido: ${vehicle.is_sold}`)
      })
    } else {
      console.log('✅ No hay vehículos vendidos en stock que necesiten limpieza')
    }
    
  } catch (error) {
    console.error('💥 Error crítico:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testConnection()
}

module.exports = { testConnection }
