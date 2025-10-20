import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// GET - Obtener preferencias del usuario
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data, error, count } = await supabase
      .from("user_preferences")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id)

    if (error) throw error

    // Si no hay registros, devolver null
    if (count === 0) {
      return NextResponse.json(null)
    }

    // Si hay múltiples registros, limpiar duplicados
    if (count > 1 && data && data.length > 1) {
      console.warn(`Se encontraron ${count} registros de preferencias para el usuario ${session.user.id}. Limpiando duplicados.`)
      
      const keepId = data[0].id
      await supabase
        .from("user_preferences")
        .delete()
        .eq("user_id", session.user.id)
        .neq("id", keepId)
    }

    return NextResponse.json(data && data.length > 0 ? data[0] : null)

  } catch (error: any) {
    console.error("Error fetching preferences:", error.message)
    return NextResponse.json({ 
      message: "Error fetching preferences", 
      error: error.message 
    }, { status: 500 })
  }
}

// POST/PUT - Guardar/actualizar preferencias del usuario
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const preferences = await request.json()
    
    // Verificar si ya existen preferencias
    const { data: existingData, count } = await supabase
      .from("user_preferences")
      .select("id", { count: "exact" })
      .eq("user_id", session.user.id)

    const now = new Date().toISOString()

    // Si hay múltiples registros, limpiar duplicados
    if (count && count > 1 && existingData && existingData.length > 1) {
      console.warn(`Se encontraron ${count} registros de preferencias para el usuario ${session.user.id}. Limpiando duplicados.`)
      
      const keepId = existingData[0].id
      await supabase
        .from("user_preferences")
        .delete()
        .eq("user_id", session.user.id)
        .neq("id", keepId)
    }

    if (existingData && existingData.length > 0) {
      // Actualizar preferencias existentes
      const { data, error } = await supabase
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: now,
        })
        .eq("id", existingData[0].id)
        .select("*")
        .single()

      if (error) throw error

      return NextResponse.json(data)
    } else {
      // Crear nuevas preferencias
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({
          user_id: session.user.id,
          theme: preferences.theme || "system",
          main_page: preferences.main_page || null,
          favorite_pages: preferences.favorite_pages || [],
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single()

      if (error) throw error

      return NextResponse.json(data)
    }

  } catch (error: any) {
    console.error("Error saving preferences:", error.message)
    return NextResponse.json({ 
      message: "Error saving preferences", 
      error: error.message 
    }, { status: 500 })
  }
}

