const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wpjmimbscfsdzcwuwctk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwam1pbWJzY2ZzZHpjd3V3Y3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY0MjI1OSwiZXhwIjoyMDYyMjE4MjU5fQ.fZ_uvDPgJLTczTNu7UMd_hcEDzYqVpDCcilTiSv-hh0'
);

async function verificar() {
  const { data: duc } = await supabase
    .from('duc_scraper')
    .select('Matrícula, Modelo, Disponibilidad')
    .ilike('Matrícula', '%0774NBT%');

  console.log('En DUC_SCRAPER:', duc?.length > 0 ? 'SI' : 'NO');
  if (duc && duc.length > 0) {
    console.log('Modelo:', duc[0]['Modelo']);
    console.log('Disponibilidad:', duc[0]['Disponibilidad']);
  }
}

verificar();



