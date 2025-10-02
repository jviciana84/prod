const fetch = require('node-fetch');

async function testOpenAI() {
  try {
    console.log('🧪 Probando API de chat...');
    
    const response = await fetch('http://localhost:3000/api/chat/simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '¿Qué vehículos BMW hay en stock?'
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

testOpenAI();

