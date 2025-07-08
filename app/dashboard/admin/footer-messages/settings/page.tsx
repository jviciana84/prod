import { supabaseAdmin } from "@/lib/supabaseClient"
import { redirect } from "next/navigation"
import { getUserRoles } from "@/lib/auth/permissions"
import FooterSettingsManager from "@/components/admin/footer-settings-manager"

export default async function FooterSettingsPage() {
  // Verificar permisos de administrador
  const roles = await getUserRoles()
  const isAdmin = roles.some((role) => role === "admin" || role === "administrador" || role.includes("admin"))

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Obtener configuración actual del footer
  const { data: settings, error } = await supabaseAdmin.from("settings").select("*").eq("key", "footer_settings").single()

  if (error && error.code !== "PGRST116") {
    console.error("Error al obtener configuración del footer:", error)
  }

  // Configuración predeterminada
  const defaultSettings = {
    show_marquee: true,
    animation_speed: 20,
    text_color: "#666666",
    hover_effect: true,
  }

  // Combinar configuración predeterminada con la almacenada
  const footerSettings = settings?.value || defaultSettings

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Footer</h1>
      </div>

      <p className="text-muted-foreground">Personaliza la apariencia y comportamiento del footer de la aplicación.</p>

      <FooterSettingsManager initialSettings={footerSettings} />
    </div>
  )
}
