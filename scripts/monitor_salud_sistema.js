const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function monitorSaludSistema() {
  console.log('='.repeat(70));
  console.log('MONITOR DE SALUD DEL SISTEMA CVO');
  console.log('='.repeat(70));
  console.log(`Fecha: ${new Date().toLocaleString('es-ES')}`);
  console.log('='.repeat(70));

  const alertas = [];
  const warnings = [];
  const info = [];

  try {
    // 1. Verificar actualización de DUC_SCRAPER
    console.log('\n1. ACTUALIZACION DE DUC_SCRAPER:');
    const { data: ducData, error: ducError } = await supabase
      .from('duc_scraper')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (ducError) throw ducError;

    if (ducData && ducData.length > 0) {
      const ultimaActualizacion = new Date(ducData[0].created_at);
      const horasDesdeActualizacion = (Date.now() - ultimaActualizacion) / (1000 * 60 * 60);
      
      console.log(`   Ultima actualizacion: ${ultimaActualizacion.toLocaleString('es-ES')}`);
      console.log(`   Hace: ${Math.round(horasDesdeActualizacion)} horas`);

      if (horasDesdeActualizacion > 24) {
        alertas.push(`DUC_SCRAPER lleva ${Math.round(horasDesdeActualizacion)} horas sin actualizar`);
        console.log('   Estado: ALERTA - Mas de 24 horas sin actualizar');
      } else if (horasDesdeActualizacion > 12) {
        warnings.push(`DUC_SCRAPER lleva ${Math.round(horasDesdeActualizacion)} horas sin actualizar`);
        console.log('   Estado: ADVERTENCIA - Mas de 12 horas sin actualizar');
      } else {
        info.push('DUC_SCRAPER actualizado recientemente');
        console.log('   Estado: OK');
      }
    }

    // 2. Verificar integridad de datos
    console.log('\n2. INTEGRIDAD DE DATOS:');
    const { data: stock, error: stockError } = await supabase
      .from('stock')
      .select('license_plate, model, is_sold');

    if (stockError) throw stockError;

    const totalStock = stock.length;
    const sinMatricula = stock.filter(v => !v.license_plate).length;
    const sinModelo = stock.filter(v => !v.model).length;
    const sinEstado = stock.filter(v => v.is_sold === null || v.is_sold === undefined).length;

    console.log(`   Total vehiculos: ${totalStock}`);
    console.log(`   Sin matricula: ${sinMatricula}`);
    console.log(`   Sin modelo: ${sinModelo}`);
    console.log(`   Sin estado (is_sold): ${sinEstado}`);

    if (sinMatricula > 0) {
      alertas.push(`${sinMatricula} vehiculos sin matricula`);
    }
    if (sinModelo > 0) {
      warnings.push(`${sinModelo} vehiculos sin modelo`);
    }
    if (sinEstado > 0) {
      warnings.push(`${sinEstado} vehiculos sin estado is_sold`);
    }

    if (sinMatricula === 0 && sinModelo === 0 && sinEstado === 0) {
      info.push('Integridad de datos OK');
      console.log('   Estado: OK');
    } else {
      console.log('   Estado: REVISAR');
    }

    // 3. Verificar sincronización DUC vs STOCK
    console.log('\n3. SINCRONIZACION DUC vs STOCK:');
    const { data: duc, error: ducErr } = await supabase
      .from('duc_scraper')
      .select('Matrícula');

    if (ducErr) throw ducErr;

    const matriculasDuc = new Set(duc.map(v => v['Matrícula']));
    const soloEnStock = stock.filter(v => !matriculasDuc.has(v.license_plate));
    const soloEnStockDisponibles = soloEnStock.filter(v => !v.is_sold);

    console.log(`   Vehiculos en DUC: ${matriculasDuc.size}`);
    console.log(`   Vehiculos en STOCK: ${totalStock}`);
    console.log(`   Solo en STOCK: ${soloEnStock.length}`);
    console.log(`   Solo en STOCK (disponibles): ${soloEnStockDisponibles.length}`);

    if (soloEnStockDisponibles.length > 0) {
      warnings.push(`${soloEnStockDisponibles.length} vehiculos disponibles que no estan en DUC`);
      console.log('   Estado: ADVERTENCIA - Hay vehiculos disponibles no sincronizados');
    } else {
      info.push('Sincronizacion DUC-STOCK OK');
      console.log('   Estado: OK');
    }

    // 4. Verificar fotos pendientes
    console.log('\n4. FOTOS PENDIENTES:');
    const { data: fotos, error: fotosErr } = await supabase
      .from('fotos')
      .select('license_plate, photos_completed, estado_pintura');

    if (fotosErr) throw fotosErr;

    const fotosPendientes = fotos.filter(f => !f.photos_completed).length;
    const fotosCompletadas = fotos.filter(f => f.photos_completed).length;

    console.log(`   Total registros: ${fotos.length}`);
    console.log(`   Fotos completadas: ${fotosCompletadas}`);
    console.log(`   Fotos pendientes: ${fotosPendientes}`);

    if (fotosPendientes > 50) {
      warnings.push(`${fotosPendientes} vehiculos con fotos pendientes`);
      console.log('   Estado: ADVERTENCIA - Muchas fotos pendientes');
    } else {
      info.push(`${fotosPendientes} fotos pendientes (normal)`);
      console.log('   Estado: OK');
    }

    // 5. Verificar distribución de estados
    console.log('\n5. DISTRIBUCION DE ESTADOS:');
    const vendidos = stock.filter(v => v.is_sold === true).length;
    const disponibles = stock.filter(v => !v.is_sold).length;
    const porcentajeVendidos = Math.round((vendidos / totalStock) * 100);

    console.log(`   VENDIDOS: ${vendidos} (${porcentajeVendidos}%)`);
    console.log(`   DISPONIBLES: ${disponibles} (${100 - porcentajeVendidos}%)`);

    if (porcentajeVendidos > 80) {
      warnings.push(`${porcentajeVendidos}% de vehiculos marcados como vendidos`);
      console.log('   Estado: ADVERTENCIA - Ratio alto de vendidos');
    } else {
      info.push('Distribucion de estados normal');
      console.log('   Estado: OK');
    }

    // 6. Verificar vehiculos duplicados
    console.log('\n6. VERIFICACION DE DUPLICADOS:');
    const matriculas = stock.map(v => v.license_plate);
    const matriculasUnicas = new Set(matriculas);
    const duplicados = matriculas.length - matriculasUnicas.size;

    console.log(`   Total matriculas: ${matriculas.length}`);
    console.log(`   Matriculas unicas: ${matriculasUnicas.size}`);
    console.log(`   Duplicados: ${duplicados}`);

    if (duplicados > 0) {
      alertas.push(`${duplicados} matriculas duplicadas en STOCK`);
      console.log('   Estado: ALERTA - Hay duplicados');
    } else {
      info.push('Sin duplicados en STOCK');
      console.log('   Estado: OK');
    }

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN DE SALUD DEL SISTEMA');
    console.log('='.repeat(70));

    if (alertas.length > 0) {
      console.log('\nALERTAS CRITICAS:');
      alertas.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
    }

    if (warnings.length > 0) {
      console.log('\nADVERTENCIAS:');
      warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    }

    console.log('\nINFORMACION:');
    info.forEach((inf, i) => console.log(`  ${i + 1}. ${inf}`));

    // Calcular puntuación de salud
    let saludScore = 100;
    saludScore -= (alertas.length * 20);
    saludScore -= (warnings.length * 5);
    saludScore = Math.max(0, saludScore);

    console.log('\n' + '='.repeat(70));
    console.log('PUNTUACION DE SALUD DEL SISTEMA');
    console.log('='.repeat(70));
    console.log(`\nPuntuacion: ${saludScore}/100`);

    if (saludScore >= 90) {
      console.log('Estado: EXCELENTE - Sistema funcionando optimo');
    } else if (saludScore >= 70) {
      console.log('Estado: BUENO - Sistema funcionando con advertencias menores');
    } else if (saludScore >= 50) {
      console.log('Estado: REGULAR - Requiere atencion');
    } else {
      console.log('Estado: CRITICO - Requiere accion inmediata');
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\nERROR:', error.message);
  }
}

monitorSaludSistema();



