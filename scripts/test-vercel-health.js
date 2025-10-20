/**
 * Script para verificar el estado de salud de Vercel
 * Prueba endpoints críticos y reporta problemas
 */

const PRODUCTION_URL = 'https://www.controlvo.ovh'
const STAGING_URL = 'https://www.controlvo.ovh' // Mismo dominio por ahora

// Endpoints críticos a probar
const ENDPOINTS = [
  { path: '/', name: 'Home', method: 'GET' },
  { path: '/api/health', name: 'Health Check', method: 'GET', optional: true },
  { path: '/api/sales/list', name: 'Sales API', method: 'GET' },
  { path: '/api/entregas/list', name: 'Entregas API', method: 'GET' },
  { path: '/api/photos/list', name: 'Photos API', method: 'GET' },
  { path: '/api/stock/list', name: 'Stock API', method: 'GET' },
  { path: '/api/transport/list', name: 'Transport API', method: 'GET' },
  { path: '/api/noticias/list', name: 'Noticias API', method: 'GET' },
  { path: '/api/validados/list', name: 'Validados API', method: 'GET' },
  { path: '/api/dashboard/rankings', name: 'Rankings API', method: 'GET' },
  { path: '/manifest.json', name: 'PWA Manifest', method: 'GET' },
  { path: '/sw.js', name: 'Service Worker', method: 'GET' },
]

async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint.path}`
  const startTime = Date.now()
  
  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'User-Agent': 'Vercel Health Check',
      },
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    const status = response.status
    const statusText = response.statusText
    
    // Intentar leer el body (solo primeros 500 chars)
    let body = ''
    try {
      const text = await response.text()
      body = text.substring(0, 500)
    } catch (e) {
      body = '[Error leyendo body]'
    }
    
    return {
      name: endpoint.name,
      path: endpoint.path,
      status,
      statusText,
      duration,
      body,
      success: status >= 200 && status < 400,
      optional: endpoint.optional || false,
    }
  } catch (error) {
    return {
      name: endpoint.name,
      path: endpoint.path,
      status: 0,
      statusText: 'ERROR',
      duration: Date.now() - startTime,
      body: error.message,
      success: false,
      optional: endpoint.optional || false,
    }
  }
}

async function testAllEndpoints(baseUrl, envName) {
  console.log(`\n🔍 === PROBANDO ${envName.toUpperCase()} (${baseUrl}) ===\n`)
  
  const results = []
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(baseUrl, endpoint)
    results.push(result)
    
    // Mostrar resultado
    const icon = result.success ? '✅' : result.optional ? '⚠️' : '❌'
    const statusColor = result.success ? '\x1b[32m' : result.optional ? '\x1b[33m' : '\x1b[31m'
    const resetColor = '\x1b[0m'
    
    console.log(
      `${icon} ${result.name.padEnd(20)} | ` +
      `${statusColor}${result.status}${resetColor} ${result.statusText.padEnd(15)} | ` +
      `${result.duration}ms`
    )
    
    if (!result.success && !result.optional) {
      console.log(`   └─ Error: ${result.body.substring(0, 100)}`)
    }
  }
  
  return results
}

function generateReport(results, envName) {
  console.log(`\n📊 === REPORTE ${envName.toUpperCase()} ===\n`)
  
  const total = results.length
  const optional = results.filter(r => r.optional).length
  const required = total - optional
  
  const successRequired = results.filter(r => r.success && !r.optional).length
  const successOptional = results.filter(r => r.success && r.optional).length
  const failedRequired = results.filter(r => !r.success && !r.optional).length
  const failedOptional = results.filter(r => !r.success && r.optional).length
  
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.duration, 0) / results.length
  )
  
  const maxDuration = Math.max(...results.map(r => r.duration))
  const slowest = results.find(r => r.duration === maxDuration)
  
  console.log(`Total endpoints: ${total}`)
  console.log(`  - Requeridos: ${required} (${successRequired} ✅, ${failedRequired} ❌)`)
  console.log(`  - Opcionales: ${optional} (${successOptional} ✅, ${failedOptional} ⚠️)`)
  console.log(`\nRendimiento:`)
  console.log(`  - Promedio: ${avgDuration}ms`)
  console.log(`  - Más lento: ${maxDuration}ms (${slowest?.name})`)
  
  const healthScore = ((successRequired / required) * 100).toFixed(1)
  console.log(`\n🏥 Estado de salud: ${healthScore}%`)
  
  if (healthScore === '100.0') {
    console.log('✅ Todo funcionando correctamente')
  } else if (healthScore >= '80.0') {
    console.log('⚠️ Funcionando con problemas menores')
  } else if (healthScore >= '50.0') {
    console.log('🔴 Funcionando con problemas mayores')
  } else {
    console.log('💀 Sistema caído o con fallos críticos')
  }
  
  return {
    total,
    required,
    optional,
    successRequired,
    successOptional,
    failedRequired,
    failedOptional,
    avgDuration,
    maxDuration,
    healthScore: parseFloat(healthScore),
  }
}

async function checkVercelDeployment() {
  console.log('🚀 === VERIFICACIÓN DE ESTADO DE VERCEL ===')
  console.log(`Fecha: ${new Date().toLocaleString('es-ES')}`)
  
  try {
    // Probar staging si existe
    let stagingResults = []
    try {
      const stagingResponse = await fetch(STAGING_URL, { method: 'HEAD' })
      if (stagingResponse.ok) {
        stagingResults = await testAllEndpoints(STAGING_URL, 'staging')
        generateReport(stagingResults, 'staging')
      } else {
        console.log('\n⚠️ Staging no disponible o no existe')
      }
    } catch (e) {
      console.log('\n⚠️ Staging no disponible:', e.message)
    }
    
    // Probar producción
    const productionResults = await testAllEndpoints(PRODUCTION_URL, 'production')
    const report = generateReport(productionResults, 'production')
    
    // Comparar staging vs production si ambos existen
    if (stagingResults.length > 0) {
      console.log('\n🔄 === COMPARACIÓN STAGING vs PRODUCTION ===\n')
      
      for (let i = 0; i < ENDPOINTS.length; i++) {
        const endpoint = ENDPOINTS[i]
        const stagingResult = stagingResults[i]
        const productionResult = productionResults[i]
        
        if (stagingResult.success !== productionResult.success) {
          console.log(`⚠️ ${endpoint.name}:`)
          console.log(`   Staging: ${stagingResult.status} (${stagingResult.duration}ms)`)
          console.log(`   Production: ${productionResult.status} (${productionResult.duration}ms)`)
        }
      }
    }
    
    console.log('\n✅ Verificación completada')
    
    return report
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (typeof require !== 'undefined' && require.main === module) {
  checkVercelDeployment()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error fatal:', error)
      process.exit(1)
    })
}

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkVercelDeployment, testEndpoint, testAllEndpoints }
}

