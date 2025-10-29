import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { matricula } = await request.json()

    if (!matricula) {
      return NextResponse.json({ ducDetails: null })
    }

    const { data, error } = await supabase
      .from('duc_scraper')
      .select('*')
      .ilike('Matrícula', matricula)
      .limit(1)
    
    if (error) {
      console.error('Error en query DUC:', error)
      return NextResponse.json({ ducDetails: null })
    }
    
    // Si no hay datos o el array está vacío, retornar null sin error
    if (!data || data.length === 0) {
      return NextResponse.json({ ducDetails: null })
    }
    
    return NextResponse.json({ ducDetails: data[0] })

  } catch (error: any) {
    console.error("Error buscando detalles de DUC:", error)
    return NextResponse.json({ 
      message: "Error al buscar detalles", 
      error: error.message 
    }, { status: 500 })
  }
}

