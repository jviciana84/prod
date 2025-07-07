import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AvatarDiagnostic from "@/components/admin/avatar-diagnostic"
import { getAllAvatars } from "@/lib/avatars"

export const metadata: Metadata = {
  title: "Diagnóstico de Avatares | CVO",
  description: "Herramienta de diagnóstico para la subida y gestión de avatares",
}

export default async function AvatarDiagnosticPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Verificar si el usuario está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Verificar si el usuario es administrador
  const { data: userRoles } = await supabase.rpc("get_user_role_names", {
    user_id_param: session.user.id,
  })

  const isAdmin = userRoles && (userRoles.includes("admin") || userRoles.includes("Administrador"))

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Obtener la lista de avatares predefinidos
  const avatars = getAllAvatars()

  // Obtener información del token de Blob
  const blobTokenAvailable = !!process.env.BLOB_READ_WRITE_TOKEN

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-2xl font-bold">Diagnóstico de Avatares</h1>
      <AvatarDiagnostic avatars={avatars} blobTokenAvailable={blobTokenAvailable} userId={session.user.id} />
    </div>
  )
}
