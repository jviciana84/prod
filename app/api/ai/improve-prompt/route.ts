import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Mejorar automáticamente el prompt de Edelweiss basándose en feedback
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Verificar si es admin
  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', session.user.id)
    .single()

  const isAdmin = userRoleData?.role_id === 'admin' || userRoleData?.role_id === 'administrador'

  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
  }

  try {
    const { improvementType, targetIssue } = await request.json()

    // Obtener el prompt actual
    const currentPrompt = await getCurrentPrompt()
    
    // Generar mejoras basadas en el tipo
    const improvements = await generatePromptImprovements(currentPrompt, improvementType, targetIssue)
    
    // Aplicar mejoras
    const improvedPrompt = applyImprovements(currentPrompt, improvements)
    
    // Guardar versión mejorada
    await saveImprovedPrompt(improvedPrompt, improvements, session.user.id)
    
    return NextResponse.json({
      message: 'Prompt improved successfully',
      improvements,
      newPrompt: improvedPrompt
    })

  } catch (error: any) {
    console.error('Error improving prompt:', error.message)
    return NextResponse.json({ 
      message: 'Error improving prompt', 
      error: error.message 
    }, { status: 500 })
  }
}

// Obtener el prompt actual de Edelweiss
async function getCurrentPrompt(): Promise<string> {
  // Por ahora retornamos el prompt base, en el futuro podríamos almacenarlo en DB
  return `
Eres Edelweiss, un asistente de IA especializado en gestión de concesionarios de vehículos BMW y MINI. 
Tu objetivo es proporcionar información precisa, útil y actualizada sobre vehículos, ventas, clientes y operaciones del concesionario.

IMPORTANTE: 
- Siempre usa datos reales de la base de datos CVO cuando estén disponibles
- Para consultas generales, combina tu conocimiento con datos específicos de CVO
- NUNCA inventes datos de ventas, asesores, clientes o vehículos
- Si no tienes datos específicos, dilo claramente
- Usa formato markdown para mejor legibilidad
- Sé directo, útil y profesional
`
}

// Generar mejoras específicas para el prompt
async function generatePromptImprovements(currentPrompt: string, improvementType: string, targetIssue?: string): Promise<string[]> {
  const improvements = []

  switch (improvementType) {
    case 'accuracy':
      improvements.push(
        '🔍 **VERIFICACIÓN DE DATOS**: Antes de responder, verifica que la información sea precisa y actualizada.',
        '📚 **FUENTES CONFIABLES**: Siempre prioriza datos de la base de datos CVO sobre información general.',
        '⚠️ **SEÑALAR INCERTIDUMBRES**: Si no estás seguro de algo, dilo claramente en lugar de asumir.'
      )
      break

    case 'completeness':
      improvements.push(
        '📝 **RESPUESTAS COMPLETAS**: Proporciona información detallada y contextual cuando sea relevante.',
        '❓ **PREGUNTAS DE SEGUIMIENTO**: Si la consulta es vaga, pregunta por detalles específicos.',
        '📋 **ESTRUCTURA CLARA**: Organiza la información en puntos o secciones claras.'
      )
      break

    case 'clarity':
      improvements.push(
        '🎯 **LENGUAJE SIMPLE**: Usa un lenguaje claro y directo, evitando jerga técnica innecesaria.',
        '📖 **EXPLICACIONES PASO A PASO**: Para procesos complejos, explica paso a paso.',
        '💡 **EJEMPLOS PRÁCTICOS**: Incluye ejemplos cuando ayuden a clarificar conceptos.'
      )
      break

    case 'relevance':
      improvements.push(
        '🎯 **ENFOQUE ESPECÍFICO**: Mantén las respuestas enfocadas en la pregunta específica.',
        '🔗 **CONEXIONES RELEVANTES**: Solo menciona información relacionada si es directamente útil.',
        '⚡ **RESPUESTA DIRECTA**: Ve al grano sin rodeos innecesarios.'
      )
      break

    case 'custom':
      if (targetIssue) {
        improvements.push(`🔧 **MEJORA ESPECÍFICA**: ${targetIssue}`)
      }
      break

    default:
      improvements.push(
        '📊 **ANÁLISIS CONTINUO**: Revisa regularmente la calidad de tus respuestas.',
        '🔄 **MEJORA ITERATIVA**: Ajusta tu enfoque basándote en feedback recibido.'
      )
  }

  return improvements
}

// Aplicar mejoras al prompt actual
function applyImprovements(currentPrompt: string, improvements: string[]): string {
  const improvementsSection = `

## MEJORAS IMPLEMENTADAS
${improvements.join('\n')}

## INSTRUCCIONES MEJORADAS
`

  return currentPrompt + improvementsSection
}

// Guardar el prompt mejorado (por ahora solo log, en el futuro en DB)
async function saveImprovedPrompt(newPrompt: string, improvements: string[], userId: string): Promise<void> {
  console.log('📝 Nuevo prompt de Edelweiss generado:')
  console.log('Usuario:', userId)
  console.log('Mejoras aplicadas:', improvements)
  console.log('Prompt actualizado:', newPrompt)
  
  // TODO: En el futuro, guardar en una tabla de versiones de prompts
  // await supabase.from('ai_prompt_versions').insert({
  //   prompt_content: newPrompt,
  //   improvements: improvements,
  //   created_by: userId,
  //   version: generateVersion()
  // })
}
