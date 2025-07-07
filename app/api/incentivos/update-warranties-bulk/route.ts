import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    const { updates } = await request.json()

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No hay actualizaciones para procesar" }, { status: 400 })
    }

    const supabase = createClient()
    let updated = 0
    let errors = 0

    for (const update of updates) {
      const { matricula, garantia } = update

      const { error } = await supabase.from("incentivos").update({ garantia }).eq("matricula", matricula)

      if (error) {
        console.error(`Error updating ${matricula}:`, error)
        errors++
      } else {
        updated++
      }
    }

    revalidatePath("/dashboard/incentivos")

    return NextResponse.json({
      success: true,
      updated,
      errors,
      message: `Actualizadas ${updated} garantías. ${errors > 0 ? `${errors} errores.` : ""}`,
    })
  } catch (error) {
    console.error("Error in bulk warranty update:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
