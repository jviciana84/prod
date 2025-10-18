// Script para limpiar Service Workers registrados
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log('🧹 Limpiando Service Workers registrados...')
    for(let registration of registrations) {
      console.log('🗑️ Desregistrando SW:', registration.scope)
      registration.unregister()
    }
    console.log('✅ Service Workers limpiados')
  })
}
