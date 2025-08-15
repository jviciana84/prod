import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("🧪 Test simple endpoint ejecutado")
  
  const response = {
    message: "Test simple funcionando",
    timestamp: new Date().toISOString(),
    success: true,
    random: Math.random()
  }
  
  console.log("🧪 Respuesta del test simple:", response)
  
  const nextResponse = NextResponse.json(response)
  
  // Agregar headers para evitar caché
  nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  nextResponse.headers.set('Pragma', 'no-cache')
  nextResponse.headers.set('Expires', '0')
  
  return nextResponse
}
