import { NextRequest, NextResponse } from 'next/server'

// Array para almacenar logs
let debugLogs: string[] = []

// Función para agregar logs
function addLog(message: string) {
  const timestamp = new Date().toISOString()
  debugLogs.push(`[${timestamp}] ${message}`)
  console.log(message) // También log normal
}

export async function POST(request: NextRequest) {
  try {
    const { message, userInfo, sessionId } = await request.json()
    
    addLog('🔍 DEBUG LOGS INICIADO')
    addLog(`Message: ${message}`)
    addLog(`UserInfo: ${JSON.stringify(userInfo)}`)
    addLog(`SessionId: ${sessionId}`)
    
    // Simular el flujo del chat
    const userIdToSave = userInfo?.id
    
    addLog(`🔍 USER ID TO SAVE: ${userIdToSave}`)
    
    if (userIdToSave) {
      addLog('✅ ENTRANDO EN GUARDADO')
      addLog('🔄 INICIANDO GUARDADO...')
      addLog('🔄 CLIENTE SUPABASE CREADO')
      addLog('🔄 RESULTADO DEL GUARDADO: { sessionId: "test-session-123" }')
      addLog('✅ Conversación guardada exitosamente: test-session-123')
      
      return NextResponse.json({ 
        success: true,
        message: 'Se intentaría guardar la conversación',
        userIdToSave,
        sessionId: 'test-session-123',
        logs: debugLogs.slice(-10) // Últimos 10 logs
      })
    } else {
      addLog('❌ NO SE PUEDE GUARDAR - NO HAY USER ID')
      return NextResponse.json({ 
        success: false,
        message: 'No se puede guardar - no hay userId',
        userInfo,
        sessionId,
        logs: debugLogs.slice(-10)
      })
    }

  } catch (error) {
    addLog(`❌ Error en debug logs: ${error}`)
    return NextResponse.json({ 
      error: 'Error en debug logs',
      details: error instanceof Error ? error.message : 'Unknown error',
      logs: debugLogs.slice(-10)
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    logs: debugLogs.slice(-20), // Últimos 20 logs
    total: debugLogs.length
  })
}
