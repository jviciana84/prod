// Script para verificar variables de entorno
require('dotenv').config({ path: '.env.local' })

console.log('🔍 === VERIFICANDO VARIABLES DE ENTORNO ===\n')

console.log('Variables de entorno cargadas:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ No configurada')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('\n❌ ERROR: NEXT_PUBLIC_SUPABASE_URL no está configurada')
} else {
  console.log('\n✅ NEXT_PUBLIC_SUPABASE_URL está configurada')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada')
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY está configurada')
}

// Verificar que las variables no estén vacías
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('\n🎉 Todas las variables están configuradas correctamente')
} else {
  console.log('\n⚠️ Faltan variables de entorno')
} 