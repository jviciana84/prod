const fetch = require('node-fetch');

async function testAdvisorQuery() {
  try {
    console.log('🧪 Probando consulta de asesor específico...');
    
    const response = await fetch('http://localhost:3000/api/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '¿Cuántos coches ha vendido Javier Capellino?'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta recibida:');
    console.log(data.response);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdvisorQuery();
