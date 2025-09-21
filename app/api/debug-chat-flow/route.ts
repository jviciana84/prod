import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, userInfo, sessionId } = await request.json()
    
    console.log('🔍 DEBUG FLOW INICIADO')
    console.log('Message:', message)
    console.log('UserInfo:', userInfo)
    console.log('SessionId:', sessionId)
    
    // Simular el flujo del chat
    const userIdToSave = userInfo?.id
    
    console.log('🔍 USER ID TO SAVE:', userIdToSave)
    
    if (userIdToSave) {
      console.log('✅ ENTRANDO EN GUARDADO')
      return NextResponse.json({ 
        success: true,
        message: 'Se intentaría guardar la conversación',
        userIdToSave,
        sessionId
      })
    } else {
      console.log('❌ NO SE PUEDE GUARDAR - NO HAY USER ID')
      return NextResponse.json({ 
        success: false,
        message: 'No se puede guardar - no hay userId',
        userInfo,
        sessionId
      })
    }

  } catch (error) {
    console.error('❌ Error en debug flow:', error)
    return NextResponse.json({ 
      error: 'Error en debug flow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
