import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Analizar patrones de feedback negativo para mejorar la IA
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
    // Obtener feedback negativo de los últimos 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: negativeFeedback, error } = await supabase
      .from('ai_feedback')
      .select(`
        *,
        ai_conversations(message, response, context_data)
      `)
      .eq('feedback_type', 'negative')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!negativeFeedback || negativeFeedback.length === 0) {
      return NextResponse.json({
        message: 'No negative feedback found in the last 30 days',
        analysis: null,
        suggestions: []
      })
    }

    // Análisis de patrones
    const analysis = analyzeFeedbackPatterns(negativeFeedback)
    
    // Generar sugerencias de mejora
    const suggestions = generateImprovementSuggestions(analysis)

    // Guardar análisis en base de datos para historial
    const { error: saveError } = await supabase
      .from('ai_feedback_analysis')
      .insert({
        analysis_date: new Date().toISOString(),
        total_negative_feedback: negativeFeedback.length,
        analysis_data: analysis,
        suggestions: suggestions,
        analyzed_by: session.user.id
      })

    if (saveError) {
      console.error('Error saving analysis:', saveError)
      // No fallar la operación por esto
    }

    return NextResponse.json({
      message: 'Analysis completed successfully',
      analysis,
      suggestions,
      totalNegativeFeedback: negativeFeedback.length,
      analyzedPeriod: 'Last 30 days'
    })

  } catch (error: any) {
    console.error('Error analyzing feedback:', error.message)
    return NextResponse.json({ 
      message: 'Error analyzing feedback', 
      error: error.message 
    }, { status: 500 })
  }
}

// Función para analizar patrones en el feedback
function analyzeFeedbackPatterns(feedback: any[]) {
  const patterns = {
    commonIssues: [] as string[],
    problematicQueries: [] as string[],
    responseTypes: {} as Record<string, number>,
    contextIssues: [] as string[],
    timePatterns: {} as Record<string, number>
  }

  // Analizar comentarios de feedback
  const comments = feedback.filter(f => f.feedback_text).map(f => f.feedback_text.toLowerCase())
  
  // Palabras clave problemáticas comunes
  const issueKeywords = {
    'información incorrecta': ['incorrecto', 'falso', 'erróneo', 'mentira'],
    'información incompleta': ['incompleto', 'falta', 'no dice', 'no menciona'],
    'respuesta confusa': ['confuso', 'no entiendo', 'claro', 'explicar'],
    'datos obsoletos': ['antiguo', 'viejo', 'actualizar', 'nuevo'],
    'respuesta irrelevante': ['irrelevante', 'no relacionado', 'fuera de tema'],
    'formato pobre': ['formato', 'estructura', 'organización']
  }

  // Contar problemas comunes
  Object.entries(issueKeywords).forEach(([issue, keywords]) => {
    const count = comments.reduce((acc, comment) => {
      return acc + keywords.filter(keyword => comment.includes(keyword)).length
    }, 0)
    
    if (count > 0) {
      patterns.commonIssues.push(`${issue}: ${count} menciones`)
    }
  })

  // Analizar tipos de consultas problemáticas
  const problematicQueries = feedback
    .map(f => f.ai_conversations?.message)
    .filter(Boolean)
    .slice(0, 10) // Top 10 más problemáticas

  patterns.problematicQueries = problematicQueries

  // Analizar patrones temporales
  feedback.forEach(f => {
    const hour = new Date(f.created_at).getHours()
    const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    patterns.timePatterns[timeSlot] = (patterns.timePatterns[timeSlot] || 0) + 1
  })

  return patterns
}

// Generar sugerencias de mejora basadas en el análisis
function generateImprovementSuggestions(analysis: any): string[] {
  const suggestions = []

  // Sugerencias basadas en problemas comunes
  if (analysis.commonIssues.some((issue: string) => issue.includes('información incorrecta'))) {
    suggestions.push('🔍 Revisar verificaciones de datos en el prompt del sistema')
    suggestions.push('📚 Mejorar instrucciones para validar información antes de responder')
  }

  if (analysis.commonIssues.some((issue: string) => issue.includes('información incompleta'))) {
    suggestions.push('📝 Expandir instrucciones para respuestas más completas')
    suggestions.push('❓ Agregar prompts para preguntar por más detalles cuando sea necesario')
  }

  if (analysis.commonIssues.some((issue: string) => issue.includes('respuesta confusa'))) {
    suggestions.push('🎯 Simplificar lenguaje técnico en las respuestas')
    suggestions.push('📋 Mejorar estructura y formato de las respuestas')
  }

  if (analysis.commonIssues.some((issue: string) => issue.includes('datos obsoletos'))) {
    suggestions.push('🕒 Actualizar referencias de tiempo en el prompt')
    suggestions.push('📅 Agregar instrucciones para mencionar cuándo se actualizaron los datos')
  }

  // Sugerencias basadas en patrones temporales
  const maxTimeSlot = Object.keys(analysis.timePatterns).reduce((a, b) => 
    analysis.timePatterns[a] > analysis.timePatterns[b] ? a : b
  )
  
  if (maxTimeSlot && analysis.timePatterns[maxTimeSlot] > 5) {
    suggestions.push(`⏰ Más problemas en ${maxTimeSlot}, considerar ajustes específicos para ese horario`)
  }

  // Sugerencias generales si hay muchos problemas
  if (analysis.commonIssues.length > 3) {
    suggestions.push('🔄 Revisar completamente el prompt del sistema de Edelweiss')
    suggestions.push('📊 Considerar entrenamiento adicional con ejemplos problemáticos')
  }

  return suggestions
}
