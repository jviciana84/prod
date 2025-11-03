import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// POST - Eliminar vehículos huérfanos de battery_control
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { orphanedIds } = await request.json()

    if (!orphanedIds || !Array.isArray(orphanedIds) || orphanedIds.length === 0) {
      return NextResponse.json({ 
        message: "No orphaned IDs provided" 
      }, { status: 400 })
    }

    console.log(`🗑️ API: Eliminando ${orphanedIds.length} vehículos huérfanos`)

    const { error } = await supabase
      .from("battery_control")
      .delete()
      .in("id", orphanedIds)

    if (error) throw error

    console.log("✅ API: Vehículos huérfanos eliminados correctamente")

    return NextResponse.json({ 
      message: "Orphaned vehicles deleted successfully",
      count: orphanedIds.length
    })

  } catch (error: any) {
    console.error("❌ API: Error eliminando vehículos huérfanos:", error.message)
    return NextResponse.json({ 
      message: "Error deleting orphaned vehicles", 
      error: error.message 
    }, { status: 500 })
  }
}

