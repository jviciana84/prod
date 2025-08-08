import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // PUSH NOTIFICATIONS ANULADO - Solo campana activa
  return NextResponse.json({ 
    success: true, 
    message: "Push notifications anuladas - solo campana activa",
    processed: 0,
    pushSent: 0
  })
}
