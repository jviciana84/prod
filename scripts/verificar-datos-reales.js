const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Error: Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDatosReales() {
  console.log('🔍 Verificando datos reales de ventas...');

  try {
    // Obtener total de ventas
    const { data: ventas, error, count } = await supabase
      .from('sales_vehicles')
      .select('client_postal_code, client_province', { count: 'exact' });

    if (error) {
      console.log('❌ Error al consultar ventas:', error);
      return;
    }

    console.log(`📊 Total de ventas: ${count}`);

    // Filtrar ventas con códigos postales
    const ventasConCodigo = ventas.filter(v => v.client_postal_code);
    console.log(`📍 Ventas con código postal: ${ventasConCodigo.length}`);

    // Mostrar algunos ejemplos
    console.log('\n📋 Ejemplos de datos:');
    ventasConCodigo.slice(0, 10).forEach((venta, i) => {
      console.log(`  ${i + 1}. Código: ${venta.client_postal_code}, Provincia: ${venta.client_province}`);
    });

    // Agrupar por códigos postales
    const ventasPorCodigo = ventasConCodigo.reduce((acc, venta) => {
      const codigo = venta.client_postal_code?.toString().substring(0, 2) || '00';
      acc[codigo] = (acc[codigo] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📍 Agrupación por códigos postales:');
    Object.entries(ventasPorCodigo)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .forEach(([codigo, cantidad]) => {
        console.log(`  ${codigo}: ${cantidad} ventas`);
      });

    // Mapeo de códigos postales a provincias
    const mapeoCodigosPostales = {
      '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
      '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
      '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
      '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
      '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
      '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
      '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
      '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia',
      '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo',
      '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza'
    };

    // Agrupar por provincias
    const ventasPorProvincia = ventasConCodigo.reduce((acc, venta) => {
      const codigo = venta.client_postal_code?.toString().substring(0, 2) || '00';
      const provincia = mapeoCodigosPostales[codigo];
      
      if (provincia) {
        acc[provincia] = (acc[provincia] || 0) + 1;
      }
      return acc;
    }, {});

    console.log('\n🏛️ Agrupación por provincias:');
    Object.entries(ventasPorProvincia)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .forEach(([provincia, cantidad]) => {
        console.log(`  ${provincia}: ${cantidad} ventas`);
      });

    console.log('\n🎯 Estado del mapa:');
    if (Object.keys(ventasPorProvincia).length > 0) {
      console.log('✅ Hay datos reales disponibles para el mapa');
      console.log(`✅ ${Object.keys(ventasPorProvincia).length} provincias con ventas`);
    } else {
      console.log('❌ No hay datos mapeables para el mapa');
    }

  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

verificarDatosReales();
