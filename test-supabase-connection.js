// Script para probar la conexión con Supabase
// Ejecutar con: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js')

// Verificar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Verificando configuración...')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada')
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ No configurada')
console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ No configurada')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  console.log('📝 Crea un archivo .env.local con las variables necesarias')
  process.exit(1)
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔄 Probando conexión con Supabase...')
    
    // Probar conexión básica
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Error de conexión:', error.message)
      return false
    }
    
    console.log('✅ Conexión exitosa con Supabase')
    return true
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
    return false
  }
}

// Ejecutar prueba
testConnection().then(success => {
  if (success) {
    console.log('🎉 ¡Configuración correcta! La página de directorio debería funcionar.')
  } else {
    console.log('💡 Revisa la configuración de Supabase en tu archivo .env.local')
  }
})
