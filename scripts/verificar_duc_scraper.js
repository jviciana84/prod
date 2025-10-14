const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificarDatos() {
  console.log('==============================================');
  console.log('VERIFICACION DE DATOS EN DUC_SCRAPER');
  console.log('==============================================\n');

  try {
    // 1. Conteo total
    console.log('1. CONTEO TOTAL DE REGISTROS');
    const { count, error: countError } = await supabase
      .from('duc_scraper')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log(`   Total registros: ${count || 0}\n`);

    // 2. Obtener primeros 5 registros
    console.log('2. PRIMEROS 5 REGISTROS:');
    const { data, error } = await supabase
      .from('duc_scraper')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('   NO HAY REGISTROS EN LA TABLA\n');
      return;
    }

    data.forEach((r, i) => {
      console.log(`\n   [${i + 1}] Registro:`);
      console.log(`       Matricula: ${r['Matrícula'] || 'NULL'}`);
      console.log(`       Modelo: ${r['Modelo'] || 'NULL'}`);
      console.log(`       Marca: ${r['Marca'] || 'NULL'}`);
      console.log(`       Disponibilidad: ${r['Disponibilidad'] || 'NULL'}`);
      console.log(`       Concesionario: ${r['Concesionario'] || 'NULL'}`);
      console.log(`       KM: ${r['KM'] || 'NULL'}`);
      console.log(`       Precio: ${r['Precio'] || 'NULL'}`);
      console.log(`       Created: ${r.created_at}`);
    });

    // 3. Contar columnas con datos
    console.log('\n\n3. ANALISIS DE DATOS:');
    const firstRecord = data[0];
    const totalColumns = Object.keys(firstRecord).length;
    const columnsWithData = Object.values(firstRecord).filter(v => v !== null && v !== '').length;
    const emptyColumns = totalColumns - columnsWithData;
    
    console.log(`   Total columnas: ${totalColumns}`);
    console.log(`   Columnas con datos: ${columnsWithData}`);
    console.log(`   Columnas vacias: ${emptyColumns}`);

    // 4. Verificar disponibilidad
    console.log('\n4. ESTADOS DE DISPONIBILIDAD:');
    const { data: disponibilidad, error: dispError } = await supabase
      .from('duc_scraper')
      .select('Disponibilidad');
    
    if (!dispError) {
      const estados = {};
      disponibilidad.forEach(r => {
        const estado = r['Disponibilidad'] || 'NULL';
        estados[estado] = (estados[estado] || 0) + 1;
      });
      
      Object.entries(estados).sort((a, b) => b[1] - a[1]).forEach(([estado, count]) => {
        console.log(`   ${estado}: ${count}`);
      });
    }

    // 5. Vehículos reservados
    console.log('\n5. VEHICULOS RESERVADOS:');
    const { data: reservados, error: resError } = await supabase
      .from('duc_scraper')
      .select('Matrícula, Modelo, Disponibilidad')
      .ilike('Disponibilidad', '%reservado%');
    
    if (!resError) {
      console.log(`   Total reservados: ${reservados.length}`);
      if (reservados.length > 0) {
        console.log('\n   Primeros 5 reservados:');
        reservados.slice(0, 5).forEach((r, i) => {
          console.log(`   ${i + 1}. ${r['Matrícula']} - ${r['Modelo']}`);
        });
      }
    }

    console.log('\n==============================================');
    console.log('VERIFICACION COMPLETADA');
    console.log('==============================================\n');

  } catch (error) {
    console.error('\nERROR:', error.message);
    console.error('Detalles:', error);
  }
}

verificarDatos();



