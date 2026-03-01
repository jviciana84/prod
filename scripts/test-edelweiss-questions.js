/**
 * Envía las preguntas de prueba directamente a la API de Edelweiss
 * y muestra las respuestas en la terminal.
 *
 * Uso: tener el servidor en marcha (npm run dev) y ejecutar:
 *   node scripts/test-edelweiss-questions.js
 *
 * Opcional: solo algunas preguntas
 *   node scripts/test-edelweiss-questions.js 3
 *   (ejecuta las 3 primeras)
 */

const BASE_URL = process.env.EDELWEISS_TEST_URL || 'http://localhost:3000'

const PREGUNTAS = [
  'Cuántos coches hemos vendido esta semana',
  'Cuántos coches hemos entregado esta semana',
  '¿Qué color es el que más se vende?',
  '¿Qué modelo se vende más?',
  'Qué vehículos hay en stock',
  'Ventas del mes',
  'Listado de entregas de la semana pasada',
  '¿Quién ganó el último GP de F1?',
]

async function ask(message, conversationHistory = []) {
  const res = await fetch(`${BASE_URL}/api/chat/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.response ?? data.error ?? '(sin respuesta)'
}

async function main() {
  const limit = parseInt(process.argv[2], 10)
  const questions = Number.isNaN(limit) ? PREGUNTAS : PREGUNTAS.slice(0, limit)

  console.log('🔗 URL:', BASE_URL)
  console.log('📋 Preguntas a ejecutar:', questions.length)
  console.log('---\n')

  let conversationHistory = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    console.log(`\n[${i + 1}/${questions.length}] ❓ ${q}`)
    try {
      const response = await ask(q, conversationHistory)
      conversationHistory.push({ role: 'user', content: q })
      conversationHistory.push({ role: 'assistant', content: response })
      const preview = response.slice(0, 400) + (response.length > 400 ? '...' : '')
      console.log('✅', preview.split('\n').join('\n   '))
    } catch (err) {
      console.error('❌ Error:', err.message)
    }
  }

  console.log('\n---\n✅ Fin.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
