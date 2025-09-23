#!/usr/bin/env node

/**
 * Script para resetear las preferencias de auto-refresh
 * Esto asegura que todos los usuarios usen la nueva configuración por defecto
 */

console.log('🔄 Reseteando preferencias de auto-refresh...')

// Simular el localStorage del navegador
const STORAGE_KEY = 'auto-refresh-preferences'
const DEFAULT_PREFERENCES = {
  enabled: true,
  interval: 2 * 60 * 1000 // 2 minutos
}

console.log('✅ Nueva configuración por defecto:')
console.log(`   - Habilitado: ${DEFAULT_PREFERENCES.enabled}`)
console.log(`   - Intervalo: ${DEFAULT_PREFERENCES.interval / 1000} segundos (${DEFAULT_PREFERENCES.interval / 60000} minutos)`)

console.log('')
console.log('📋 Para aplicar estos cambios:')
console.log('1. Abre la consola del navegador (F12)')
console.log('2. Ejecuta: localStorage.removeItem("auto-refresh-preferences")')
console.log('3. Recarga la página (F5)')
console.log('')
console.log('O simplemente recarga la página - el nuevo valor por defecto se aplicará automáticamente.')