const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificarEstructura() {
  try {
    const { data, error } = await supabase
      .from('vehicle_sale_status')
      .select('*')
      .limit(1);

    if (error) {
      console.log('ERROR:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('Columnas de vehicle_sale_status:');
      Object.keys(data[0]).forEach((col, i) => {
        console.log(`  ${i + 1}. ${col}`);
      });
    } else {
      console.log('Tabla vacia, intentando insertar un registro de prueba...');
      
      const { error: insertError } = await supabase
        .from('vehicle_sale_status')
        .insert({
          vehicle_id: 'test',
          source_table: 'test'
        });
      
      console.log('Error al insertar:', insertError);
    }

  } catch (error) {
    console.error('ERROR:', error);
  }
}

verificarEstructura();



