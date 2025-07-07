import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar que el usuario es admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar rol de admin
    const { data: userRoles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", session.user.id)

    const isAdmin = userRoles?.some((ur: any) => ["admin", "administrador"].includes(ur.roles?.name?.toLowerCase()))

    if (!isAdmin) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // 1. Obtener todos los asesores únicos de entregas
    const { data: entregasData, error: entregasError } = await supabase
      .from("entregas")
      .select("asesor")
      .not("asesor", "is", null)
      .neq("asesor", "")

    if (entregasError) {
      return NextResponse.json({ error: "Error al obtener entregas" }, { status: 500 })
    }

    // Contar entregas por asesor
    const asesorCounts: Record<string, number> = {}
    entregasData.forEach((item: any) => {
      if (item.asesor) {
        asesorCounts[item.asesor] = (asesorCounts[item.asesor] || 0) + 1
      }
    })

    // 2. Obtener usuarios con perfiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role
      `)
      .not("full_name", "is", null)

    if (profilesError) {
      return NextResponse.json({ error: "Error al obtener perfiles" }, { status: 500 })
    }

    // 3. Obtener emails de usuarios
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
    }

    // Crear mapa de user_id -> email
    const userEmails: Record<string, string> = {}
    usersData.users.forEach((user) => {
      if (user.email) {
        userEmails[user.id] = user.email
      }
    })

    // 4. Obtener mapeos existentes
    const { data: existingMappings, error: mappingsError } = await supabase
      .from("user_asesor_mapping")
      .select("user_id, asesor_alias")
      .eq("active", true)

    if (mappingsError) {
      return NextResponse.json({ error: "Error al obtener mapeos existentes" }, { status: 500 })
    }

    const existingMappingsSet = new Set(existingMappings.map((m: any) => `${m.user_id}-${m.asesor_alias}`))

    // 5. Crear mapeos automáticos
    const newMappings = []

    for (const profile of profilesData) {
      const email = userEmails[profile.id]
      if (!email) continue

      const fullNameLower = profile.full_name.toLowerCase()

      for (const [asesor, count] of Object.entries(asesorCounts)) {
        const mappingKey = `${profile.id}-${asesor}`

        // Skip si ya existe el mapeo
        if (existingMappingsSet.has(mappingKey)) continue

        let shouldMap = false
        let confidence = "LOW"

        // Mapeos específicos conocidos
        if (fullNameLower.includes("jordi") && asesor === "JordiVi") {
          shouldMap = true
          confidence = "HIGH"
        } else if (fullNameLower.includes("sara") && asesor === "SaraMe") {
          shouldMap = true
          confidence = "HIGH"
        } else if (fullNameLower.includes("javier") && asesor === "JavierCa") {
          shouldMap = true
          confidence = "HIGH"
        }
        // Mapeo por iniciales (ej: "Ana María" -> "AnaMa")
        else if (asesor.length >= 6) {
          const firstNamePart = fullNameLower.split(" ")[0]
          const secondNamePart = fullNameLower.split(" ")[1] || ""

          if (firstNamePart && secondNamePart) {
            const expectedAlias = (
              firstNamePart.substring(0, Math.floor(asesor.length / 2)) +
              secondNamePart.substring(0, Math.ceil(asesor.length / 2))
            ).toLowerCase()

            if (asesor.toLowerCase() === expectedAlias) {
              shouldMap = true
              confidence = "MEDIUM"
            }
          }
        }
        // Mapeo por primera palabra del nombre
        else {
          const firstName = fullNameLower.split(" ")[0]
          if (firstName && asesor.toLowerCase().startsWith(firstName.substring(0, Math.min(4, firstName.length)))) {
            shouldMap = true
            confidence = "LOW"
          }
        }

        if (shouldMap && confidence !== "LOW") {
          // Solo crear mapeos con confianza media o alta
          newMappings.push({
            user_id: profile.id,
            profile_name: profile.full_name,
            asesor_alias: asesor,
            email: email,
            active: true,
          })
        }
      }
    }

    // 6. Insertar nuevos mapeos
    let created = 0
    if (newMappings.length > 0) {
      const { error: insertError } = await supabase.from("user_asesor_mapping").insert(newMappings)

      if (insertError) {
        console.error("Error inserting mappings:", insertError)
        return NextResponse.json({ error: "Error al crear mapeos" }, { status: 500 })
      }

      created = newMappings.length
    }

    return NextResponse.json({
      success: true,
      created,
      suggested: newMappings.length,
      message: `Se crearon ${created} mapeos automáticamente`,
    })
  } catch (error) {
    console.error("Error in auto-map-users:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
