// Script de prueba para la API CVO Scraper
// Ejecutar con: node test_api_post.js

const API_URL = 'http://localhost:3000/api/import-csv';
const API_KEY = 'cvo-scraper-2024';

// Datos de prueba (un registro de ejemplo)
const testData = {
  "ID Anuncio": "TEST-001",
  "Anuncio": "BMW X3 2.0d xDrive",
  "Marca": "BMW",
  "Modelo": "X3",
  "Versión": "2.0d xDrive",
  "Precio": "45000",
  "KM": "25000",
  "Año": "2022",
  "Combustible": "Diésel",
  "Cambio": "Automático",
  "Color Carrocería": "Blanco",
  "Chasis": "WBA8E9G50JNT12345",
  "URL": "https://ejemplo.com/vehiculo",
  "Concesionario": "BMW Madrid",
  "Estado": "Disponible"
};

async function testAPI() {
  console.log('🧪 Probando API CVO Scraper...');
  console.log('📡 URL:', API_URL);
  console.log('🔑 API Key:', API_KEY);
  console.log('📊 Datos de prueba:', testData);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csv_data: testData,
        file_name: 'test_data.csv',
        api_key: API_KEY
      })
    });

    const result = await response.json();
    
    console.log('\n📋 Respuesta de la API:');
    console.log('Status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ ¡API funcionando correctamente!');
      console.log('📝 Acción:', result.action);
      console.log('🆔 ID del registro:', result.record_id);
    } else {
      console.log('\n❌ Error en la API:');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.log('💡 Asegúrate de que el servidor esté corriendo: npm run dev');
  }
}

// Ejecutar la prueba
testAPI(); 