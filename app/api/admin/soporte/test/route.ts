import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("🧪 Endpoint de prueba ejecutado")
  
  return NextResponse.json({ 
    message: "Endpoint de prueba funcionando",
    timestamp: new Date().toISOString(),
    success: true
  })
}
