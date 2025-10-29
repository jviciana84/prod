/**
 * INVESTIGACIÓN: ¿Qué está marcando automáticamente los coches como completados?
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarProblema() {
  console.log('\n🔍 INVESTIGACIÓN: ¿Qué marca automáticamente como completado?\n');
  console.log('='.repeat(80));

  try {
    // 1. Ver todos los vehículos completados HOY (28 octubre)
    const hoy = new Date().toISOString().split('T')[0]; // 2025-10-28
    
    const { data: completadosHoy, error: error1 } = await supabase
      .from('fotos')
      .select('license_plate, model, photos_completed, auto_completed, photos_completed_date, updated_at')
      .eq('photos_completed', true)
      .gte('photos_completed_date', `${hoy}T00:00:00`)
      .order('photos_completed_date', { ascending: false });

    if (error1) throw error1;

    console.log(`\n📅 VEHÍCULOS COMPLETADOS HOY (${hoy}):`);
    console.log('='.repeat(80));
    console.log(`Total: ${completadosHoy.length}`);

    if (completadosHoy.length > 0) {
      console.log('\nListado:');
      completadosHoy.forEach((v, i) => {
        const hora = v.photos_completed_date 
          ? new Date(v.photos_completed_date).toLocaleTimeString('es-ES')
          : 'N/A';
        const autoCompletado = v.auto_completed ? '🤖 AUTO' : '👤 MANUAL';
        console.log(`${(i + 1).toString().padStart(2, ' ')}. ${v.license_plate.padEnd(10)} - ${v.model.padEnd(40)} [${hora}] ${autoCompletado}`);
      });
    }

    // 2. Ver estado de auto_completed
    const { data: todosVehiculos, error: error2 } = await supabase
      .from('fotos')
      .select('license_plate, model, photos_completed, auto_completed')
      .eq('photos_completed', true);

    if (error2) throw error2;

    const autoCompletados = todosVehiculos.filter(v => v.auto_completed === true).length;
    const manuales = todosVehiculos.filter(v => !v.auto_completed).length;
    const motos = todosVehiculos.filter(v => 
      v.model && (v.model.toLowerCase().includes('motorrad') || v.model.toLowerCase().includes('moto '))
    ).length;

    console.log('\n' + '='.repeat(80));
    console.log('📊 ESTADÍSTICAS GENERALES:');
    console.log('='.repeat(80));
    console.log(`Total completados: ${todosVehiculos.length}`);
    console.log(`  ├─ 🤖 Auto-completados: ${autoCompletados}`);
    console.log(`  ├─ 👤 Manuales: ${manuales}`);
    console.log(`  └─ 🏍️  Motos: ${motos}`);

    // 3. Ver vehículos completados SIN fotos reales en DUC
    console.log('\n' + '='.repeat(80));
    console.log('🔍 VERIFICANDO FOTOS REALES EN DUC...');
    console.log('='.repeat(80));

    const sinFotosReales = [];

    for (const vehiculo of todosVehiculos) {
      const esMoto = vehiculo.model && (
        vehiculo.model.toLowerCase().includes('motorrad') ||
        vehiculo.model.toLowerCase().includes('moto ')
      );

      if (esMoto) continue;

      const { data: ducData, error: ducError } = await supabase
        .from('duc_scraper')
        .select('"Matrícula", "URL foto 9", "URL foto 10", "URL foto 11", "URL foto 12", "URL foto 13", "URL foto 14", "URL foto 15"')
        .eq('Matrícula', vehiculo.license_plate)
        .single();

      if (ducError && ducError.code !== 'PGRST116') continue;
      if (!ducData) continue;

      const tieneFotosReales = !!(
        ducData['URL foto 9'] || 
        ducData['URL foto 10'] || 
        ducData['URL foto 11'] ||
        ducData['URL foto 12'] ||
        ducData['URL foto 13'] ||
        ducData['URL foto 14'] ||
        ducData['URL foto 15']
      );

      if (!tieneFotosReales) {
        sinFotosReales.push({
          license_plate: vehiculo.license_plate,
          model: vehiculo.model,
          auto_completed: vehiculo.auto_completed
        });
      }
    }

    console.log(`\n❌ Completados SIN fotos reales en DUC: ${sinFotosReales.length}`);
    
    if (sinFotosReales.length > 0) {
      const autosSinFotos = sinFotosReales.filter(v => v.auto_completed === true).length;
      const manualesSinFotos = sinFotosReales.filter(v => !v.auto_completed).length;
      
      console.log(`  ├─ 🤖 Auto-completados: ${autosSinFotos}`);
      console.log(`  └─ 👤 Manuales: ${manualesSinFotos}`);
    }

    // 4. Ver pendientes
    const { count: pendientes } = await supabase
      .from('fotos')
      .select('*', { count: 'exact', head: true })
      .eq('photos_completed', false);

    console.log('\n' + '='.repeat(80));
    console.log(`⏳ PENDIENTES ACTUALES: ${pendientes}`);
    console.log('='.repeat(80));

    // 5. RESUMEN
    console.log('\n' + '='.repeat(80));
    console.log('🚨 PROBLEMA DETECTADO:');
    console.log('='.repeat(80));
    
    if (sinFotosReales.length > 0) {
      console.log(`\n❌ Hay ${sinFotosReales.length} vehículos marcados como completados`);
      console.log('   pero SIN fotos reales en DUC (solo fotos dummy 1-8)');
      
      if (completadosHoy.length > 0) {
        console.log(`\n⚠️  ${completadosHoy.length} se marcaron como completados HOY`);
        const autosHoy = completadosHoy.filter(v => v.auto_completed === true).length;
        console.log(`   ${autosHoy} fueron auto-completados (probablemente por trigger)`);
      }
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

investigarProblema();


