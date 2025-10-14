const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function obtenerFotos() {
  const { data, error } = await supabase
    .from('duc_scraper')
    .select('*')
    .eq('Matrícula', '0774NBT');

  if (error) {
    console.log('ERROR:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No encontrado en DUC');
    return;
  }

  // Usar el primer registro (el más reciente debería estar primero)
  const vehiculo = data[0];
  
  if (data.length > 1) {
    console.log(`NOTA: Se encontraron ${data.length} registros, mostrando el primero\n`);
  }

  console.log('='.repeat(70));
  console.log('FOTOS DEL VEHICULO 0774NBT EN DUC');
  console.log('='.repeat(70));
  console.log('');
  console.log('Modelo:', vehiculo['Modelo']);
  console.log('Disponibilidad:', vehiculo['Disponibilidad']);
  console.log('');

  let totalFotos = 0;

  for (let i = 1; i <= 15; i++) {
    const url = vehiculo[`URL foto ${i}`];
    if (url && url !== '') {
      totalFotos++;
      console.log(`Foto ${i}: ${url}`);
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log(`Total fotos encontradas: ${totalFotos}`);
  console.log('='.repeat(70));
}

obtenerFotos();

