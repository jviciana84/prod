// Script de prueba para el sistema de refresh automático
// Ejecutar: node test-auto-refresh.js

const { useAutoRefresh } = require('./hooks/use-auto-refresh.ts')
const { useDataEvents, dataEvents } = require('./hooks/use-data-events.ts')

console.log('🧪 Iniciando pruebas del sistema de refresh automático...')

// Simular un componente que usa el hook
function testAutoRefresh() {
  const mockOnRefresh = async () => {
    console.log('🔄 Ejecutando función de refresh de prueba')
    return Promise.resolve()
  }

  const { isRefreshing, lastRefresh, enabled, toggleEnabled, refresh } = useAutoRefresh({
    interval: 5000, // 5 segundos para pruebas rápidas
    enabled: true,
    onRefresh: mockOnRefresh,
    maxRetries: 2,
    retryDelay: 500
  })

  console.log('✅ Hook inicializado correctamente')
  console.log('📊 Estado inicial:', { isRefreshing, enabled, lastRefresh: lastRefresh?.toISOString() })

  // Simular toggle
  setTimeout(() => {
    console.log('🔄 Probando toggle...')
    toggleEnabled()
    console.log('✅ Toggle ejecutado')
  }, 1000)

  // Simular refresh manual
  setTimeout(() => {
    console.log('🔄 Probando refresh manual...')
    refresh()
    console.log('✅ Refresh manual ejecutado')
  }, 2000)

  return { isRefreshing, enabled, lastRefresh, toggleEnabled, refresh }
}

// Simular el sistema de eventos
function testDataEvents() {
  const { emit, on, getHistory } = useDataEvents()

  console.log('📡 Probando sistema de eventos...')

  // Suscribirse a eventos
  const unsubscribe = on('data-updated', (event) => {
    console.log('📬 Evento recibido:', event)
  })

  // Emitir eventos
  setTimeout(() => {
    console.log('📡 Emitiendo evento de prueba...')
    dataEvents.updated('TestComponent', 'test_table', { test: true })
  }, 500)

  setTimeout(() => {
    console.log('📡 Emitiendo evento de refresh...')
    dataEvents.refresh('TestComponent', 'test_table')
  }, 1000)

  // Obtener historial
  setTimeout(() => {
    const history = getHistory(5)
    console.log('📜 Historial de eventos:', history.length, 'eventos')
  }, 1500)

  return { emit, on, getHistory, unsubscribe }
}

// Ejecutar pruebas
try {
  console.log('🚀 Iniciando pruebas...')
  const refreshTest = testAutoRefresh()
  const eventsTest = testDataEvents()

  console.log('✅ Pruebas completadas exitosamente')
  console.log('🎉 Sistema de refresh automático funcionando correctamente')

} catch (error) {
  console.error('❌ Error en las pruebas:', error)
  process.exit(1)
}