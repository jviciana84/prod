import { openai } from '@/lib/openai-config'

interface EquipmentScore {
  name: string
  score: number // 0-10
  category: 'premium' | 'safety' | 'comfort' | 'performance' | 'technology' | 'aesthetic' | 'standard'
  reasoning: string
}

/**
 * Usa IA para puntuar la calidad/valor de opcionales de vehículos BMW/MINI
 */
export async function scoreEquipmentWithAI(equipmentList: string[]): Promise<Map<string, number>> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API Key no configurada, usando puntuación básica')
      return getBasicScoring(equipmentList)
    }

    // Crear prompt para la IA
    const prompt = `Eres un experto en vehículos BMW y MINI. Analiza la siguiente lista de opcionales y puntúa cada uno del 1 al 10 según su valor/deseabilidad.

Criterios de puntuación:
- 10 pts: Opcionales premium exclusivos (John Cooper Works, Head-Up Display, M Sport, etc.)
- 8-9 pts: Tecnología avanzada (Driving Assistant, cámaras 360, navegación)
- 6-7 pts: Confort y seguridad importantes (asientos calefactados, alarma, sensores)
- 4-5 pts: Equipamiento estándar mejorado (llantas deportivas, retrovisores)
- 1-3 pts: Equipamiento básico obligatorio (luces, neumáticos básicos)

IMPORTANTE:
- "Acabado Favoured" = 9 pts (es superior a Classic)
- "Acabado Classic" = 7 pts
- "Asientos deportivos John Cooper Works" = 10 pts (premium máximo)
- "Paquete M" = 9 pts (deportivo)
- Cualquier cosa "John Cooper Works" o "JCW" = 10 pts

Opcionales a puntuar:
${equipmentList.map((eq, i) => `${i + 1}. ${eq}`).join('\n')}

Responde SOLO con un JSON array con este formato:
[{"name": "nombre_opcional", "score": 8}]

Sin explicaciones adicionales, solo el JSON.`

    console.log('🤖 Solicitando puntuación de IA para', equipmentList.length, 'opcionales')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo más económico para esta tarea
      messages: [
        {
          role: 'system',
          content: 'Eres un experto tasador de vehículos BMW/MINI. Respondes SOLO con JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Baja temperatura para respuestas consistentes
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    console.log('📝 Respuesta IA (primeros 200 chars):', responseText.substring(0, 200))

    // Parsear respuesta
    let scores: EquipmentScore[]
    try {
      const parsed = JSON.parse(responseText)
      scores = parsed.scores || parsed.equipments || parsed
      
      if (!Array.isArray(scores)) {
        scores = Object.values(scores)
      }
    } catch (parseError) {
      console.error('❌ Error parseando respuesta IA:', parseError)
      return getBasicScoring(equipmentList)
    }

    // Convertir a Map
    const scoreMap = new Map<string, number>()
    
    scores.forEach((item: any) => {
      const name = item.name || item.equipment || item.optional
      const score = item.score || item.value || item.points || 5
      
      if (name && typeof score === 'number') {
        scoreMap.set(name, Math.max(1, Math.min(10, score)))
      }
    })

    console.log('✅ Puntuaciones IA generadas:', scoreMap.size, 'opcionales')

    // Si no se puntuaron todos, completar con puntuación básica
    equipmentList.forEach(eq => {
      if (!scoreMap.has(eq)) {
        scoreMap.set(eq, getBasicScore(eq))
      }
    })

    return scoreMap

  } catch (error: any) {
    console.error('❌ Error en puntuación con IA:', error.message)
    return getBasicScoring(equipmentList)
  }
}

/**
 * Puntuación básica sin IA (fallback)
 */
function getBasicScoring(equipmentList: string[]): Map<string, number> {
  const scoreMap = new Map<string, number>()
  
  equipmentList.forEach(eq => {
    scoreMap.set(eq, getBasicScore(eq))
  })
  
  return scoreMap
}

/**
 * Obtener puntuación básica de un opcional
 */
function getBasicScore(equipment: string): number {
  const eqLower = equipment.toLowerCase()
  
  // Premium (10 pts)
  if (
    eqLower.includes('john cooper works') ||
    eqLower.includes('jcw') ||
    eqLower.includes('deportivos') ||
    eqLower.includes('favoured') ||
    eqLower.includes('head-up display')
  ) {
    return 10
  }
  
  // Alto valor (8-9 pts)
  if (
    eqLower.includes('paquete m') ||
    eqLower.includes('driving assistant') ||
    eqLower.includes('cámara') ||
    eqLower.includes('navegador') ||
    eqLower.includes('parking assistant')
  ) {
    return 9
  }
  
  // Classic y confort (7 pts)
  if (
    eqLower.includes('classic') ||
    eqLower.includes('calefacción') ||
    eqLower.includes('cuero') ||
    eqLower.includes('asientos calefact')
  ) {
    return 7
  }
  
  // Seguridad y tech (6 pts)
  if (
    eqLower.includes('alarma') ||
    eqLower.includes('led') ||
    eqLower.includes('sensores') ||
    eqLower.includes('active guard')
  ) {
    return 6
  }
  
  // Estándar (5 pts)
  return 5
}

