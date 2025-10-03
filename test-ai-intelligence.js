const fetch = require('node-fetch');

async function testAIIntelligence() {
  try {
    console.log('🧪 Probando inteligencia restaurada de Edelweiss...');
    
    // Prueba 1: Consulta sobre colonias
    console.log('\n📝 Prueba 1: Consulta sobre colonias');
    const response1 = await fetch('http://localhost:3000/api/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '¿Qué colonia me recomiendas para impresionar a mi jefe? Algo con notas de vainilla'
      })
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Respuesta sobre colonias:');
      console.log(data1.response);
    }

    // Prueba 2: Consulta general
    console.log('\n📝 Prueba 2: Consulta general');
    const response2 = await fetch('http://localhost:3000/api/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '¿Cuál es la capital de Francia?'
      })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Respuesta general:');
      console.log(data2.response);
    }

    // Prueba 3: Consulta de datos específicos
    console.log('\n📝 Prueba 3: Consulta de datos específicos');
    const response3 = await fetch('http://localhost:3000/api/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '¿Cuántos coches ha vendido Javier Capellino?'
      })
    });

    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ Respuesta sobre ventas:');
      console.log(data3.response);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAIIntelligence();
