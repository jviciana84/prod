import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    console.log("📧 Obteniendo configuración pública de email...")

    // Obtener configuración sin verificar permisos (para uso interno del sistema)
    const { data, error } = await supabase.from("email_config").select("*").limit(1).single()

    if (error) {
      console.error("❌ Error obteniendo configuración:", error)

      // Devolver configuración por defecto
      const defaultConfig = {
        id: 1,
        enabled: false,
        sender_email: "material@controlvo.ovh",
        sender_name: "Sistema CVO - Material",
        cc_emails: [],
        subject_template: "Entrega de llaves / documentación - {fecha}",
        body_template:
          "Hola,\n\nRegistro de entrega de material.\n\nFecha: {fecha}\n\nMaterial entregado:\n{materiales}\n\nSaludos.",
      }

      console.log("📧 Usando configuración por defecto")
      return NextResponse.json(defaultConfig)
    }

    console.log("✅ Configuración obtenida exitosamente:", {
      enabled: data.enabled,
      sender_email: data.sender_email,
      cc_emails_count: data.cc_emails?.length || 0,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ Error crítico obteniendo configuración:", error)

    // Devolver configuración por defecto en caso de error
    return NextResponse.json({
      id: 1,
      enabled: false,
      sender_email: "material@controlvo.ovh",
      sender_name: "Sistema CVO - Material",
      cc_emails: [],
      subject_template: "Entrega de llaves / documentación - {fecha}",
      body_template:
        "Hola,\n\nRegistro de entrega de material.\n\nFecha: {fecha}\n\nMaterial entregado:\n{materiales}\n\nSaludos.",
    })
  }
}
