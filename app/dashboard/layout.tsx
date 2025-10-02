import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardSidebar from "@/components/dashboard/sidebar"
import MobileSidebar from "@/components/dashboard/mobile-sidebar"
import DashboardHeader from "@/components/dashboard/header"
import { DashboardFooter } from "@/components/dashboard/footer"
import { getUserRoles } from "@/lib/auth/permissions"
import { AnimatedGridBackgroundDashboard } from "@/components/ui/animated-grid-background-dashboard"
import { SessionRefresh } from "@/components/auth/session-refresh"
import { createServerClient } from "@/lib/supabase/server"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatProvider } from "@/contexts/chat-context"
import { GlobalChat } from "@/components/global-chat"
import "@/styles/dashboard-layout.css"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/")
  }

  // Verificar si el usuario necesita cambiar su contraseña
  const forcePasswordChange = user.user_metadata?.force_password_change
  if (forcePasswordChange) {
    redirect("/force-password-change")
  }

  const roles = await getUserRoles()

  return (
    <ChatProvider>
      <SidebarProvider>
        <div className="dashboard-layout">
          {/* Fondo sólido solo en modo oscuro */}
          <div className="fixed inset-0 -z-10 pointer-events-none dark:block hidden" style={{background: '#111A23'}} />

          {/* Header siempre visible en la parte superior */}
          <div className="dashboard-header">
            <DashboardHeader user={user} roles={roles} />
          </div>

          {/* Área de contenido principal */}
          <div className="dashboard-content-area">
            {/* Sidebar siempre visible en el lado izquierdo */}
            <DashboardSidebar roles={roles} />

            {/* Contenido principal con scroll independiente */}
            <main className="dashboard-main-content">
              {/* Sin container ni padding lateral, solo padding vertical */}
              <div className="w-full py-6">
                {children}
              </div>
            </main>
          </div>

          {/* Sidebar móvil - solo visible en móvil */}
          <MobileSidebar roles={roles} />

          {/* Footer siempre visible en la parte inferior */}
          <div className="dashboard-footer">
            <DashboardFooter />
          </div>

          {/* SessionRefresh componente */}
          <SessionRefresh />
          
          {/* Chat global */}
          <GlobalChat />
        </div>
      </SidebarProvider>
    </ChatProvider>
  )
}
