const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Error: Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstructura() {
  console.log('🔍 Verificando estructura de la tabla sales_vehicles...');

  try {
    // Obtener una muestra de datos para ver las columnas
    const { data: muestra, error } = await supabase
      .from('sales_vehicles')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error al consultar tabla:', error);
      return;
    }

    if (muestra && muestra.length > 0) {
      console.log('📊 Columnas disponibles:');
      Object.keys(muestra[0]).forEach(columna => {
        console.log(`  - ${columna}: ${typeof muestra[0][columna]}`);
      });
      
      console.log('\n📋 Muestra de datos:');
      console.log(JSON.stringify(muestra[0], null, 2));
    } else {
      console.log('❌ No hay datos en la tabla');
    }

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

verificarEstructura();

