/**
 * Verificar estado actual: Coches marcados como completados
 * pero sin fotos reales en DUC
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

async function verificarEstadoActual() {
  console.log('\n📊 ESTADO ACTUAL: Coches fotografiados sin fotos reales en DUC\n');
  console.log('='.repeat(80));

  try {
    // 1. Obtener vehículos completados
    const { data: vehiculosCompletados, error: fotosError } = await supabase
      .from('fotos')
      .select('id, license_plate, model, photos_completed, auto_completed, photos_completed_date')
      .eq('photos_completed', true);

    if (fotosError) throw fotosError;

    // 2. Verificar cuáles NO tienen fotos reales en DUC
    const sinFotosReales = [];

    for (const vehiculo of vehiculosCompletados) {
      // Filtrar motos
      const esMoto = vehiculo.model && (
        vehiculo.model.toLowerCase().includes('motorrad') ||
        vehiculo.model.toLowerCase().includes('moto ')
      );

      if (esMoto) continue;

      // Buscar en DUC
      const { data: ducData, error: ducError } = await supabase
        .from('duc_scraper')
        .select('"Matrícula", "Modelo", "URL foto 9", "URL foto 10", "URL foto 11", "URL foto 12", "URL foto 13", "URL foto 14", "URL foto 15"')
        .eq('Matrícula', vehiculo.license_plate)
        .single();

      if (ducError && ducError.code !== 'PGRST116') continue;
      
      // Si no está en DUC, está bien
      if (!ducData) continue;

      // Verificar si tiene fotos REALES (9+)
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
          modeloDuc: ducData['Modelo'],
          photos_completed_date: vehiculo.photos_completed_date,
          auto_completed: vehiculo.auto_completed
        });
      }
    }

    // 3. Mostrar resultados
    console.log(`\n📋 Total vehículos BPS completados: ${vehiculosCompletados.length - 27}`); // -27 motos aprox
    console.log(`🔴 Completados SIN fotos reales en DUC: ${sinFotosReales.length}`);
    console.log('='.repeat(80));

    if (sinFotosReales.length === 0) {
      console.log('\n✅ ¡PERFECTO! Todos los vehículos marcados como completados tienen fotos reales en DUC.');
      console.log('='.repeat(80));
      return;
    }

    console.log('\n📋 LISTA DE VEHÍCULOS SIN FOTOS REALES EN DUC:');
    console.log('   (Marcados como completados pero solo tienen fotos dummy)');
    console.log('-'.repeat(80));

    sinFotosReales.forEach((v, i) => {
      const fecha = v.photos_completed_date 
        ? new Date(v.photos_completed_date).toLocaleDateString('es-ES')
        : 'N/A';
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${v.license_plate.padEnd(10)} - ${v.model.padEnd(40)} [${fecha}]`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`📊 TOTAL: ${sinFotosReales.length} vehículos`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

verificarEstadoActual();

