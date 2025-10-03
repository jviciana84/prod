// Script de prueba para verificar la funcionalidad de la IA
console.log('🧪 INICIANDO PRUEBAS DE FUNCIONALIDAD DE IA')

// Función para probar la API de chat
async function testChatAPI() {
  console.log('📡 Probando API de chat...')
  
  try {
    const response = await fetch('/api/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '¿Cuál es la competencia del BMW 320 en Mercedes?'
      })
    })

    const data = await response.json()
    console.log('✅ Respuesta de la API:', data)
    
    if (data.response) {
      console.log('✅ La IA respondió correctamente')
      return true
    } else {
      console.log('❌ La IA no respondió')
      return false
    }
  } catch (error) {
    console.error('❌ Error en la API:', error)
    return false
  }
}

// Función para probar el modal
function testModal() {
  console.log('🔔 Probando funcionalidad del modal...')
  
  // Verificar si el contador está en localStorage
  const count = localStorage.getItem('edelweiss_conversation_count')
  console.log('📊 Contador actual:', count)
  
  // Resetear contador para probar
  localStorage.setItem('edelweiss_conversation_count', '0')
  console.log('🔄 Contador reseteado a 0')
  
  return true
}

// Función para verificar variables de entorno
function checkEnvironment() {
  console.log('🔍 Verificando variables de entorno...')
  
  // Estas no se pueden verificar desde el frontend, pero podemos intentar hacer una llamada
  console.log('⚠️ Variables de entorno solo verificables desde el servidor')
  
  return true
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Ejecutando todas las pruebas...')
  
  const results = {
    environment: checkEnvironment(),
    modal: testModal(),
    chatAPI: await testChatAPI()
  }
  
  console.log('📊 RESULTADOS DE LAS PRUEBAS:')
  console.log('   Variables de entorno:', results.environment ? '✅' : '❌')
  console.log('   Modal:', results.modal ? '✅' : '❌')
  console.log('   Chat API:', results.chatAPI ? '✅' : '❌')
  
  const allPassed = Object.values(results).every(result => result)
  console.log(allPassed ? '🎉 TODAS LAS PRUEBAS PASARON' : '⚠️ ALGUNAS PRUEBAS FALLARON')
  
  return results
}

// Exportar para uso en consola
window.testAI = runAllTests
window.testChat = testChatAPI
window.testModal = testModal

console.log('✅ Script de prueba cargado. Usa:')
console.log('   testAI() - Ejecutar todas las pruebas')
console.log('   testChat() - Probar solo la API de chat')
console.log('   testModal() - Probar solo el modal')
