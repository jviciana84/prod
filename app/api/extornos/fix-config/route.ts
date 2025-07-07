import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    console.log("🔧 === REPARANDO CONFIGURACIÓN DE EXTORNOS ===")

    // Verificar estado actual
    const { data: currentConfig, error: currentError } = await supabase.from("extornos_email_config").select("*")

    console.log("📊 Estado actual:", { currentConfig, currentError })

    // Si no hay configuración, crearla
    if (!currentConfig || currentConfig.length === 0) {
      console.log("➕ Creando configuración por defecto...")

      const { data: newConfig, error: insertError } = await supabase
        .from("extornos_email_config")
        .insert({
          enabled: true,
          email_tramitador: "tramitador@motormunich.net",
          email_pagador: "pagos@motormunich.net",
          cc_emails: ["jordi.viciana@munichgroup.es"],
        })
        .select()

      if (insertError) {
        console.error("❌ Error insertando configuración:", insertError)
        return NextResponse.json({
          success: false,
          error: "Error insertando configuración",
          details: insertError,
        })
      }

      console.log("✅ Configuración creada:", newConfig)
    }

    // Si hay múltiples configuraciones, limpiar y crear una sola
    if (currentConfig && currentConfig.length > 1) {
      console.log("🧹 Limpiando múltiples configuraciones...")

      // Eliminar todas
      await supabase.from("extornos_email_config").delete().neq("id", 0)

      // Crear una nueva
      const { data: newConfig, error: insertError } = await supabase
        .from("extornos_email_config")
        .insert({
          enabled: true,
          email_tramitador: "tramitador@motormunich.net",
          email_pagador: "pagos@motormunich.net",
          cc_emails: ["jordi.viciana@munichgroup.es"],
        })
        .select()

      console.log("✅ Configuración única creada:", newConfig)
    }

    // Verificar configuración final
    const { data: finalConfig, error: finalError } = await supabase.from("extornos_email_config").select("*").single()

    if (finalError) {
      console.error("❌ Error obteniendo configuración final:", finalError)
      return NextResponse.json({
        success: false,
        error: "Error obteniendo configuración final",
        details: finalError,
      })
    }

    console.log("✅ Configuración final:", finalConfig)

    return NextResponse.json({
      success: true,
      message: "Configuración reparada exitosamente",
      config: finalConfig,
    })
  } catch (error) {
    console.error("❌ Error crítico:", error)
    return NextResponse.json({
      success: false,
      error: "Error crítico",
      details: error.message,
    })
  }
}
