import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { getUserRoles } from "@/lib/auth/permissions"
import { MessageSquare, Users, Calendar, Filter } from "lucide-react"
import ConversationsClient from "./conversations-client"

export default async function ConversationsAdminPage() {
  const cookieStore = await cookies()
  const supabase = await createServerClient(cookieStore)
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const userRoles = await getUserRoles(user.id)
  const hasAdminAccess = userRoles.includes("admin") || userRoles.includes("super_admin")

  if (!hasAdminAccess) {
    redirect("/dashboard")
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">Administración de Conversaciones</h1>
            </div>
            <p className="text-muted-foreground">Gestiona todas las conversaciones con Edelweiss AI</p>
          </div>
        </div>
      </div>

      <ConversationsClient />
    </div>
  )
}
