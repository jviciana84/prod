const fetch = require('node-fetch');

async function testRealDataOnly() {
  try {
    console.log('🧪 Probando que la IA solo use datos reales...');
    
    // Prueba con un asesor que probablemente no existe
    console.log('\n📝 Prueba 1: Asesor inexistente (debería decir que no tiene datos)');
    const response1 = await fetch('http://localhost:3000/api/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '¿Cuántos coches ha vendido Pol?'
      })
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Respuesta sobre Pol:');
      console.log(data1.response);
      
      // Verificar que no inventa datos
      if (data1.response.includes('Juan Pérez') || data1.response.includes('Laura Martínez') || data1.response.includes('Carlos López')) {
        console.log('❌ ERROR: La IA está inventando datos falsos!');
      } else if (data1.response.includes('No tengo datos') || data1.response.includes('No se encontraron')) {
        console.log('✅ CORRECTO: La IA no inventa datos cuando no los tiene');
      }
    }

    // Prueba con otro asesor inexistente
    console.log('\n📝 Prueba 2: Otro asesor inexistente');
    const response2 = await fetch('http://localhost:3000/api/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '¿Cuántos coches ha vendido Asesor Inexistente?'
      })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Respuesta sobre Asesor Inexistente:');
      console.log(data2.response);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealDataOnly();
