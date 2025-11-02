import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getUserRoles } from "@/lib/auth/permissions"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Obtener usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si es admin
    const roles = await getUserRoles(user.id)
    const isAdmin = roles.includes("admin")

    // Obtener enlace del asesor (si existe tabla)
    const { data: advisorLink } = await supabase
      .from("advisor_tasacion_links")
      .select("*")
      .eq("advisor_id", user.id)
      .single()

    // Construir query de tasaciones
    let tasacionesQuery = supabase
      .from("tasaciones")
      .select("*")
      .order("created_at", { ascending: false })

    // Si NO es admin, filtrar solo por su slug
    if (!isAdmin && advisorLink?.slug) {
      tasacionesQuery = tasacionesQuery.eq("advisor_slug", advisorLink.slug)
    }
    // Si es admin, devuelve TODAS las tasaciones (sin filtro)

    const { data: tasaciones, error: tasacionesError } = await tasacionesQuery

    if (tasacionesError) {
      console.error("Error al cargar tasaciones:", tasacionesError)
      // Si la tabla no existe, retornar vacío
      if (tasacionesError.message.includes("does not exist")) {
        return NextResponse.json({
          data: {
            tasaciones: [],
            advisorLink: null,
            currentUser: {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name,
            },
            isAdmin,
          },
        })
      }
      return NextResponse.json({ error: tasacionesError.message }, { status: 500 })
    }

    // Enriquecer con conteo de fotos
    const { data: fotosCounts } = await supabase
      .from("tasacion_fotos")
      .select("tasacion_id")

    const fotosCountMap: Record<string, number> = {}
    fotosCounts?.forEach((foto) => {
      fotosCountMap[foto.tasacion_id] = (fotosCountMap[foto.tasacion_id] || 0) + 1
    })

    // Log para debugging
    console.log('📊 Ejemplo de tasación (primera):', tasaciones?.[0] ? {
      id: tasaciones[0].id,
      matricula: tasaciones[0].matricula,
      tramitada: tasaciones[0].tramitada,
      tramitada_exists: 'tramitada' in tasaciones[0]
    } : 'No hay tasaciones')

    const tasacionesEnriquecidas = tasaciones?.map((t) => {
      // Parsear metadata
      let metadata = t.metadata
      try {
        if (typeof t.metadata === 'string') {
          metadata = JSON.parse(t.metadata)
        }
      } catch (e) {
        console.error("Error parseando metadata:", e)
      }

      return {
        ...t,
        metadata,
        total_fotos: fotosCountMap[t.id] || 0,
      }
    })

    console.log('📊 Tasaciones tramitadas:', tasacionesEnriquecidas?.filter(t => t.tramitada).length || 0)
    console.log('📊 Tasaciones sin tramitar:', tasacionesEnriquecidas?.filter(t => !t.tramitada).length || 0)

    return NextResponse.json({
      data: {
        tasaciones: tasacionesEnriquecidas || [],
        advisorLink: advisorLink || null,
        currentUser: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
        },
        isAdmin,
      },
    })
  } catch (error) {
    console.error("Unexpected error in tasaciones list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

