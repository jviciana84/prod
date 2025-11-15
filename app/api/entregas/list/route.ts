import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Obtener sesión del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role, alias")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Determinar filtro según rol
    const isAdmin = profileData?.role?.toLowerCase() === "admin"

    // Obtener el alias del asesor del usuario para filtrar entregas
    let asesorAlias: string | null = null
    
    if (!isAdmin) {
      // 1. Primero intentar obtener alias desde profiles.alias
      if (profileData?.alias) {
        asesorAlias = profileData.alias
        console.log("✅ Alias encontrado en profiles.alias:", asesorAlias)
      } else {
        // 2. Si no hay alias en profiles, buscar en user_asesor_mapping
        const { data: mapping, error: mappingError } = await supabase
          .from("user_asesor_mapping")
          .select("asesor_alias")
          .eq("user_id", session.user.id)
          .eq("active", true)
          .single()

        if (mapping && !mappingError) {
          asesorAlias = mapping.asesor_alias
          console.log("✅ Alias encontrado en user_asesor_mapping:", asesorAlias)
        } else if (mappingError) {
          console.warn("⚠️ No se encontró mapeo en user_asesor_mapping:", mappingError.message)
        }

        // 3. Fallback: usar full_name si no se encuentra alias
        // Esto puede funcionar si el asesor en entregas coincide con el nombre completo
        if (!asesorAlias && profileData?.full_name) {
          asesorAlias = profileData.full_name
          console.log("⚠️ Usando full_name como fallback:", asesorAlias)
        }
      }
    }

    // Construir query de entregas
    let query = supabase.from("entregas").select("*").order("fecha_venta", { ascending: false })

    // Filtrar por asesor si no es admin y tenemos un alias
    if (!isAdmin && asesorAlias) {
      query = query.ilike("asesor", asesorAlias)
      console.log("🔍 Filtrando entregas por asesor:", asesorAlias)
    } else if (!isAdmin && !asesorAlias) {
      console.warn("⚠️ No se pudo determinar alias del asesor, no se filtrarán entregas")
      // Si no podemos determinar el alias, devolver array vacío para usuarios no admin
      return NextResponse.json({
        data: {
          entregas: [],
          user: {
            id: session.user.id,
            email: session.user.email,
          },
          profile: profileData,
        },
      })
    }

    const { data: entregas, error: entregasError } = await query

    if (entregasError) {
      console.error("Error fetching entregas:", entregasError)
      return NextResponse.json({ error: entregasError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        entregas: entregas || [],
        user: {
          id: session.user.id,
          email: session.user.email,
        },
        profile: profileData,
      },
    })
  } catch (error) {
    console.error("Unexpected error in entregas list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

