import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Obtener insights y estadísticas de feedback
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7' // días por defecto

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Estadísticas generales
    const { data: totalFeedback, error: totalError } = await supabase
      .from('ai_feedback')
      .select('feedback_type', { count: 'exact' })
      .gte('created_at', startDate.toISOString())

    if (totalError) throw totalError

    // Feedback por tipo
    const { data: feedbackByType, error: typeError } = await supabase
      .from('ai_feedback')
      .select('feedback_type')
      .gte('created_at', startDate.toISOString())

    if (typeError) throw typeError

    const positiveCount = feedbackByType?.filter(f => f.feedback_type === 'positive').length || 0
    const negativeCount = feedbackByType?.filter(f => f.feedback_type === 'negative').length || 0
    const totalCount = positiveCount + negativeCount

    // Tasa de satisfacción
    const satisfactionRate = totalCount > 0 ? (positiveCount / totalCount) * 100 : 0

    // Feedback negativo con comentarios
    const { data: negativeWithComments, error: negativeError } = await supabase
      .from('ai_feedback')
      .select(`
        feedback_text,
        created_at,
        ai_conversations(message, response)
      `)
      .eq('feedback_type', 'negative')
      .not('feedback_text', 'is', null)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (negativeError) throw negativeError

    // Patrones temporales
    const { data: hourlyData, error: hourlyError } = await supabase
      .from('ai_feedback')
      .select('feedback_type, created_at')
      .gte('created_at', startDate.toISOString())

    if (hourlyError) throw hourlyError

    // Agrupar por horas
    const hourlyPatterns = {} as Record<string, { positive: number, negative: number }>
    hourlyData?.forEach(feedback => {
      const hour = new Date(feedback.created_at).getHours()
      if (!hourlyPatterns[hour]) {
        hourlyPatterns[hour] = { positive: 0, negative: 0 }
      }
      hourlyPatterns[hour][feedback.feedback_type as 'positive' | 'negative']++
    })

    // Top problemas (palabras clave en comentarios negativos)
    const commentTexts = negativeWithComments?.map(f => f.feedback_text).filter(Boolean) || []
    const problemKeywords = analyzeProblemKeywords(commentTexts)

    // Tendencias (comparar con período anterior)
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - parseInt(period))

    const { data: previousFeedback, error: previousError } = await supabase
      .from('ai_feedback')
      .select('feedback_type')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    if (previousError) throw previousError

    const previousPositive = previousFeedback?.filter(f => f.feedback_type === 'positive').length || 0
    const previousNegative = previousFeedback?.filter(f => f.feedback_type === 'negative').length || 0
    const previousTotal = previousPositive + previousNegative
    const previousSatisfaction = previousTotal > 0 ? (previousPositive / previousTotal) * 100 : 0

    const satisfactionTrend = satisfactionRate - previousSatisfaction

    return NextResponse.json({
      period: `${period} days`,
      totalFeedback: totalCount,
      satisfaction: {
        rate: Math.round(satisfactionRate * 100) / 100,
        positive: positiveCount,
        negative: negativeCount,
        trend: Math.round(satisfactionTrend * 100) / 100
      },
      recentNegativeFeedback: negativeWithComments || [],
      hourlyPatterns,
      problemKeywords,
      alerts: generateAlerts(satisfactionRate, negativeCount, satisfactionTrend)
    })

  } catch (error: any) {
    console.error('Error fetching insights:', error.message)
    return NextResponse.json({ 
      message: 'Error fetching insights', 
      error: error.message 
    }, { status: 500 })
  }
}

// Analizar palabras clave problemáticas en comentarios
function analyzeProblemKeywords(comments: string[]): Array<{keyword: string, count: number}> {
  const keywordMap = {} as Record<string, number>
  
  const problemWords = [
    'incorrecto', 'falso', 'erróneo', 'mentira',
    'incompleto', 'falta', 'no dice', 'no menciona',
    'confuso', 'no entiendo', 'claro', 'explicar',
    'antiguo', 'viejo', 'actualizar', 'nuevo',
    'irrelevante', 'no relacionado', 'fuera de tema',
    'formato', 'estructura', 'organización'
  ]

  comments.forEach(comment => {
    problemWords.forEach(word => {
      if (comment.toLowerCase().includes(word)) {
        keywordMap[word] = (keywordMap[word] || 0) + 1
      }
    })
  })

  return Object.entries(keywordMap)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

// Generar alertas basadas en métricas
function generateAlerts(satisfactionRate: number, negativeCount: number, trend: number): Array<{type: string, message: string, severity: string}> {
  const alerts = []

  if (satisfactionRate < 70) {
    alerts.push({
      type: 'low_satisfaction',
      message: `Tasa de satisfacción baja: ${Math.round(satisfactionRate)}%`,
      severity: 'high'
    })
  }

  if (negativeCount > 10) {
    alerts.push({
      type: 'high_negative_feedback',
      message: `${negativeCount} feedback negativos en el período`,
      severity: 'medium'
    })
  }

  if (trend < -10) {
    alerts.push({
      type: 'declining_satisfaction',
      message: `Satisfacción disminuyendo: ${Math.round(Math.abs(trend))}%`,
      severity: 'high'
    })
  }

  if (satisfactionRate > 90 && trend > 5) {
    alerts.push({
      type: 'excellent_performance',
      message: `Excelente rendimiento: ${Math.round(satisfactionRate)}%`,
      severity: 'success'
    })
  }

  return alerts
}
