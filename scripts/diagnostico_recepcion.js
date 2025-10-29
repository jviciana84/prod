// ============================================
// SCRIPT DE DIAGNÓSTICO: Sistema de Recepción
// ============================================
// Ejecutar: node scripts/diagnostico_recepcion.js

const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', BASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE RECEPCIÓN\n');

// Función helper para hacer requests a Supabase
async function supabaseQuery(table, select = '*') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}/rest/v1/${table}`);
    url.searchParams.append('select', select);

    const options = {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(url.toString(), options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Error parsing JSON: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function diagnostico() {
  try {
    console.log('📋 1. Verificando tablas...\n');

    // Verificar tabla advisors
    try {
      const advisors = await supabaseQuery('advisors');
      console.log(`✅ Tabla 'advisors': ${advisors.length} registros`);
      
      if (advisors.length > 0) {
        console.log('\n   Asesores encontrados:');
        advisors.forEach(adv => {
          console.log(`   - ${adv.full_name}`);
          console.log(`     Especialización: ${adv.specialization.join(', ')}`);
          console.log(`     Activo: ${adv.is_active}`);
          console.log(`     De vacaciones: ${adv.is_on_vacation}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️ No hay asesores creados aún');
      }
    } catch (e) {
      console.log(`❌ Tabla 'advisors' no existe o tiene errores`);
      console.log(`   Error: ${e.message}`);
    }

    console.log('');

    // Verificar tabla visit_assignments
    try {
      const visits = await supabaseQuery('visit_assignments');
      console.log(`✅ Tabla 'visit_assignments': ${visits.length} registros`);
    } catch (e) {
      console.log(`❌ Tabla 'visit_assignments' no existe o tiene errores`);
      console.log(`   Error: ${e.message}`);
    }

    console.log('');

    // Verificar tabla visit_queue_config
    try {
      const config = await supabaseQuery('visit_queue_config');
      console.log(`✅ Tabla 'visit_queue_config': ${config.length} registros`);
    } catch (e) {
      console.log(`❌ Tabla 'visit_queue_config' no existe o tiene errores`);
      console.log(`   Error: ${e.message}`);
    }

    console.log('\n');
    console.log('📋 2. Verificando asesores disponibles por tipo...\n');

    try {
      const advisors = await supabaseQuery('advisors', 'full_name,specialization,is_active,is_on_vacation');
      
      const tipos = ['COCHE_VN', 'COCHE_VO', 'MOTO_VN', 'MOTO_VO'];
      
      tipos.forEach(tipo => {
        const disponibles = advisors.filter(adv => 
          adv.is_active && 
          !adv.is_on_vacation && 
          adv.specialization.includes(tipo)
        );
        
        if (disponibles.length > 0) {
          console.log(`✅ ${tipo}: ${disponibles.length} asesor(es) disponible(s)`);
          disponibles.forEach(adv => {
            console.log(`   - ${adv.full_name}`);
          });
        } else {
          console.log(`⚠️ ${tipo}: 0 asesores disponibles`);
        }
        console.log('');
      });
    } catch (e) {
      console.log(`❌ Error verificando asesores: ${e.message}`);
    }

    console.log('\n📋 3. Resumen\n');

    try {
      const advisors = await supabaseQuery('advisors');
      const activos = advisors.filter(a => a.is_active && !a.is_on_vacation);
      
      if (activos.length === 0) {
        console.log('⚠️ PROBLEMA: No hay asesores activos disponibles');
        console.log('');
        console.log('SOLUCIÓN:');
        console.log('1. Ir a: http://localhost:3000/dashboard/recepcion-admin');
        console.log('2. Crear al menos un asesor con especializaciones');
        console.log('');
      } else {
        console.log('✅ Sistema configurado correctamente');
        console.log(`   ${activos.length} asesor(es) activo(s)`);
        console.log('');
        console.log('Puedes probar el sistema en:');
        console.log('   http://localhost:3000/recepcion');
      }
    } catch (e) {
      console.log('❌ Error en diagnóstico final');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

diagnostico();

