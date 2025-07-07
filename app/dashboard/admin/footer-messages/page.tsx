import { createServerComponentClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserRoles } from "@/lib/auth/permissions"
import FooterMessageManager from "@/components/admin/footer-message-manager"

export default async function FooterMessagesPage() {
  // Verificar permisos de administrador
  const roles = await getUserRoles()
  const isAdmin = roles.some((role) => role === "admin" || role === "administrador" || role.includes("admin"))

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Obtener mensajes del footer
  const supabase = createServerComponentClient()
  const { data: messages, error } = await supabase
    .from("footer_messages")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error al obtener mensajes del footer:", error)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Mensajes del Footer</h1>
      </div>

      <p className="text-muted-foreground">
        Administra los mensajes que se muestran en el footer de la aplicación. Estos mensajes se mostrarán en un
        carrusel rotativo y desaparecerán automáticamente después de la fecha de caducidad.
      </p>

      <FooterMessageManager initialMessages={messages || []} />
    </div>
  )
}
