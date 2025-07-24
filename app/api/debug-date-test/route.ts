import { NextRequest, NextResponse } from "next/server"
import { formatDateForDisplay } from "@/lib/date-utils"

export async function GET(request: NextRequest) {
  try {
    // Simular una fecha que introduces manualmente (por ejemplo, 15/12/2024)
    const testDate = "2024-12-15T00:00:00.000Z" // Esto es lo que se guarda cuando introduces 15/12/2024
    
    const formattedDate = formatDateForDisplay(testDate)
    
    // Obtener información de debug
    const now = new Date()
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    return NextResponse.json({
      testDate,
      formattedDate,
      currentTime: now.toISOString(),
      currentTimeLocal: now.toString(),
      timezone,
      debug: {
        originalDate: testDate,
        parsedDate: new Date(testDate).toString(),
        toLocaleDateString: new Date(testDate).toLocaleDateString('es-ES'),
        toLocaleDateStringWithOptions: new Date(testDate).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 