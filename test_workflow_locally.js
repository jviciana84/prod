// Script de prueba para diagnosticar el problema del workflow
const { createClient } = require('@supabase/supabase-js');

// Simular las variables de entorno del workflow
const supabaseUrl = process.env.SUPABASE_URL || 'TU_URL_AQUI';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_KEY_AQUI';

console.log('🔍 Verificando variables de entorno...');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ No configurado');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Configurado' : '❌ No configurado');

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'TU_URL_AQUI' || supabaseKey === 'TU_KEY_AQUI') {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('Por favor, configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🚀 Iniciando prueba de conexión...');
    
    // Verificar conexión a Supabase
    console.log('🔗 Probando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase.from('fotos').select('count').limit(1);
    
    if (testError) {
      console.error('❌ Error conectando a Supabase:', testError);
      process.exit(1);
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    
    // Probar la función SQL
    console.log('📊 Probando función mark_photos_as_completed...');
    const { data, error } = await supabase.rpc('mark_photos_as_completed');
    
    if (error) {
      console.error('❌ Error ejecutando función:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    
    console.log('✅ Función ejecutada correctamente');
    console.log('📊 Resultados:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testConnection(); 