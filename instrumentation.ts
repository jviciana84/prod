// Archivo de instrumentación de Next.js
// Se ejecuta ANTES de cualquier código de la aplicación

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Cargar polyfill de DOMMatrix en Node.js
    try {
      const DOMMatrixPolyfill = (await import('dommatrix')).default
      ;(global as any).DOMMatrix = DOMMatrixPolyfill
      ;(global as any).DOMPoint = class DOMPoint {
        x = 0
        y = 0
        z = 0
        w = 1
        constructor(x = 0, y = 0, z = 0, w = 1) {
          this.x = x
          this.y = y
          this.z = z
          this.w = w
        }
      }
      console.log('✅ [Instrumentation] DOMMatrix polyfill cargado globalmente')
    } catch (error) {
      console.error('❌ [Instrumentation] Error cargando DOMMatrix polyfill:', error)
    }
  }
}

