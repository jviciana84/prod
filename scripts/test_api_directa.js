const fetch = require('node-fetch')

async function test() {
  console.log('\n🔍 Probando API directamente...\n')
  
  const url = 'http://localhost:3000/api/comparador/analisis?toleranciaAño=2'
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.error) {
      console.log('❌ Error:', data.error)
      return
    }
    
    // Buscar el vehículo 9853MKL
    const vehiculo = data.vehiculos.find(v => v.license_plate === '9853MKL')
    
    if (!vehiculo) {
      console.log('❌ No se encontró 9853MKL en la respuesta')
      console.log(`Total vehículos: ${data.vehiculos.length}`)
      return
    }
    
    console.log('✅ VEHÍCULO ENCONTRADO:\n')
    console.log(JSON.stringify(vehiculo, null, 2))
    
    console.log('\n═'.repeat(80))
    console.log(`🎯 PRECIO RECOMENDADO: ${vehiculo.precioRecomendado?.toLocaleString()}€`)
    console.log(`   Precio actual: ${vehiculo.nuestroPrecio?.toLocaleString()}€`)
    console.log(`   Gama: ${vehiculo.gama}`)
    console.log(`   Equipamiento: ${vehiculo.equipamiento}`)
    console.log(`   Competidores comparables: ${vehiculo.competidores}`)
    console.log('═'.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

test().then(() => process.exit(0))



