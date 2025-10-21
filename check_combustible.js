require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCombustible() {
  try {
    console.log('🔍 Consultando valores de Combustible...');
    
    const { data, error } = await supabase
      .from('duc_scraper')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    console.log(`📊 Encontrados ${data.length} registros:`);
    console.log('');
    
    data.forEach((record, i) => {
      console.log(`${i+1}. Modelo: "${record.Modelo}" | Marca: "${record.Marca}"`);
      console.log(`   Combustible: "${record.Combustible || 'VACÍO'}"`);
      console.log(`   Tipo motor: "${record['Tipo motor'] || 'VACÍO'}"`);
      console.log('');
    });
      
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCombustible();
