import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)

    console.log("🔍 Cargando mapeos...")

    // 1. Obtener mapeos existentes
    const { data: mappings, error: mappingsError } = await supabase
      .from("user_asesor_mapping")
      .select("*")
      .eq("active", true)

    console.log("✅ Mapeos encontrados:", mappings?.length || 0)

    // 2. Obtener TODOS los asesores posibles (no solo los que tienen entregas)
    const allAsesores = new Set<string>()

    // Asesores de entregas
    const { data: entregas } = await supabase
      .from("entregas")
      .select("asesor")
      .not("asesor", "is", null)
      .neq("asesor", "")

    entregas?.forEach((item: any) => {
      if (item.asesor) allAsesores.add(item.asesor)
    })

    // Asesores de sales_vehicles
    const { data: sales } = await supabase
      .from("sales_vehicles")
      .select("asesor")
      .not("asesor", "is", null)
      .neq("asesor", "")

    sales?.forEach((item: any) => {
      if (item.asesor) allAsesores.add(item.asesor)
    })

    // Asesores de stock (excluyendo entregados)
    const { data: stock } = await supabase.from("stock").select("asesor").not("asesor", "is", null).neq("asesor", "")
    stock?.forEach((item: any) => {
      if (item.asesor) allAsesores.add(item.asesor)
    })

    // Contar entregas por asesor
    const asesorCounts: Record<string, number> = {}
    entregas?.forEach((item: any) => {
      if (item.asesor) {
        asesorCounts[item.asesor] = (asesorCounts[item.asesor] || 0) + 1
      }
    })

    // 3. Asesores sin mapear
    const mappedAsesores = new Set(mappings?.map((m: any) => m.asesor_alias) || [])
    const unmappedAsesores = Array.from(allAsesores)
      .filter((asesor) => !mappedAsesores.has(asesor))
      .map((asesor) => ({
        asesor,
        entregas_count: asesorCounts[asesor] || 0,
      }))
      .sort((a, b) => b.entregas_count - a.entregas_count)

    // 4. Usuarios disponibles con emails reales
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .not("full_name", "is", null)

    // Obtener emails usando RPC
    const userEmails: Record<string, string> = {}
    try {
      const { data: emailsData } = await supabase.rpc("get_user_emails")
      if (emailsData) {
        emailsData.forEach((user: any) => {
          userEmails[user.id] = user.email
        })
      }
    } catch (error) {
      console.log("⚠️ Error obteniendo emails:", error)
    }

    const availableUsers =
      profiles?.map((profile: any) => ({
        user_id: profile.id,
        full_name: profile.full_name,
        role: profile.role || "",
        email: userEmails[profile.id] || "Email no disponible",
      })) || []

    const result = {
      mappings: mappings || [],
      unmappedAsesores,
      availableUsers,
      allAsesores: Array.from(allAsesores).sort(), // Lista completa para el selector
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json({ error: "Error: " + (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const body = await request.json()
    const { userId, asesorAlias } = body

    if (!userId || !asesorAlias) {
      return NextResponse.json({ error: "userId y asesorAlias son requeridos" }, { status: 400 })
    }

    // Obtener datos del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar si ya existe mapeo
    const { data: existingMapping } = await supabase
      .from("user_asesor_mapping")
      .select("id")
      .eq("user_id", userId)
      .eq("active", true)
      .single()

    if (existingMapping) {
      return NextResponse.json({ error: "Este usuario ya tiene un mapeo activo" }, { status: 400 })
    }

    // Obtener email real
    let userEmail = "Email no disponible"
    try {
      const { data: emailData } = await supabase.rpc("get_user_email", { user_id: userId })
      if (emailData) userEmail = emailData
    } catch (error) {
      console.log("⚠️ No se pudo obtener email:", error)
    }

    // Crear mapeo
    const mappingData = {
      user_id: userId,
      profile_name: profile.full_name,
      asesor_alias: asesorAlias,
      email: userEmail,
      active: true,
    }

    const { data, error } = await supabase.from("user_asesor_mapping").insert(mappingData).select().single()

    if (error) {
      return NextResponse.json({ error: "Error al crear mapeo: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, mapping: data })
  } catch (error) {
    return NextResponse.json({ error: "Error interno: " + (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { searchParams } = new URL(request.url)
    const mappingId = searchParams.get("id")

    if (!mappingId) {
      return NextResponse.json({ error: "ID de mapeo requerido" }, { status: 400 })
    }

    const { error } = await supabase.from("user_asesor_mapping").update({ active: false }).eq("id", mappingId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
