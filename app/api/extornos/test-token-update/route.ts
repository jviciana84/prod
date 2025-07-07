import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createClient()
  const { extorno_id } = await request.json()

  if (!extorno_id) {
    return NextResponse.json({ success: false, message: "Extorno ID es requerido." }, { status: 400 })
  }

  console.log(`[TOKEN-TEST] Iniciando prueba para extorno ID: ${extorno_id}`)

  try {
    // 1. Verificar que el extorno existe
    const { data: initialExtorno, error: fetchError } = await supabase
      .from("extornos")
      .select("id, confirmation_token")
      .eq("id", extorno_id)
      .single()

    if (fetchError || !initialExtorno) {
      console.error("[TOKEN-TEST] Error buscando extorno:", fetchError)
      return NextResponse.json(
        { success: false, message: `Extorno con ID ${extorno_id} no encontrado.`, error: fetchError?.message },
        { status: 404 },
      )
    }
    console.log(`[TOKEN-TEST] Extorno encontrado. Token actual: ${initialExtorno.confirmation_token}`)

    // 2. Generar nuevo token
    const newToken = crypto.randomUUID()
    console.log(`[TOKEN-TEST] Nuevo token generado: ${newToken}`)

    // 3. Intentar actualizar
    const { data: updatedExtorno, error: updateError } = await supabase
      .from("extornos")
      .update({ confirmation_token: newToken })
      .eq("id", extorno_id)
      .select("id, confirmation_token")
      .single()

    // 4. Analizar el resultado
    if (updateError) {
      console.error("[TOKEN-TEST] Error en la operación de UPDATE:", updateError)
      return NextResponse.json(
        { success: false, message: "Error al actualizar en la base de datos.", error: updateError.message },
        { status: 500 },
      )
    }

    if (!updatedExtorno) {
      console.error(
        "[TOKEN-TEST] El update no devolvió un registro. Esto puede indicar un problema de permisos o que el ID no existe, aunque se encontró antes.",
      )
      return NextResponse.json(
        {
          success: false,
          message: "La actualización no devolvió ningún registro. Posible problema de RLS o el registro fue eliminado.",
        },
        { status: 500 },
      )
    }

    console.log(
      `[TOKEN-TEST] Respuesta del UPDATE: ID=${updatedExtorno.id}, Token=${updatedExtorno.confirmation_token}`,
    )

    // 5. Verificación final
    if (updatedExtorno.confirmation_token === newToken) {
      console.log("[TOKEN-TEST] ¡ÉXITO! El token en la base de datos coincide con el nuevo token.")
      return NextResponse.json({
        success: true,
        message: `Token actualizado exitosamente a: ${newToken}`,
        data: updatedExtorno,
      })
    } else {
      console.error("[TOKEN-TEST] ¡FALLO! El token en la base de datos NO coincide con el nuevo token.")
      return NextResponse.json(
        {
          success: false,
          message: "Fallo de verificación. El token guardado no es el esperado.",
          data: updatedExtorno,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[TOKEN-TEST] Error catastrófico:", error)
    const err = error as Error
    return NextResponse.json(
      { success: false, message: "Error inesperado en el servidor.", error: err.message },
      { status: 500 },
    )
  }
}
