import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

    return NextResponse.json({ 
      success: true,
      vapidPublicKey: vapidPublicKey ? "✅ Configurada" : "❌ No configurada",
      vapidPrivateKey: vapidPrivateKey ? "✅ Configurada" : "❌ No configurada",
      vapidPublicKeyLength: vapidPublicKey?.length || 0,
      vapidPrivateKeyLength: vapidPrivateKey?.length || 0,
      environment: process.env.NODE_ENV
    })

  } catch (error: any) {
    console.error("Error verificando VAPID keys:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 