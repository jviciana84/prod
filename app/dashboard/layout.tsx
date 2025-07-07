import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardHeader from "@/components/dashboard/header"
import { DashboardFooter } from "@/components/dashboard/footer"
import { getUserRoles } from "@/lib/auth/permissions"
import { AnimatedGridBackgroundDashboard } from "@/components/ui/animated-grid-background-dashboard"
import { SessionRefresh } from "@/components/auth/session-refresh"
import { createServerClient } from "@/lib/supabase/server"

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

  const roles = await getUserRoles()

  return (
    <div className="flex min-h-screen flex-col relative">
      {/* Fondo sólido solo en modo oscuro */}
      <div className="fixed inset-0 -z-10 pointer-events-none dark:block hidden" style={{background: '#111A23'}} />

      {/* Fondo animado tipo blob eliminado, fondo oscuro liso */}

      {/* Fondo animado con cuadrícula y degradado */}
      {/* <AnimatedGridBackgroundDashboard /> */}

      {/* Header siempre visible en la parte superior */}
      <DashboardHeader user={user} roles={roles} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar siempre visible en el lado izquierdo */}
        <DashboardSidebar roles={roles} />

        {/* Contenido principal con scroll independiente - padding ajustado para compensar el sidebar fijo */}
        <main className="container max-w-full px-4 md:px-6 lg:px-8 xl:px-10 py-6 flex-1 overflow-auto p-4 md:p-5 ml-16">
          {children}
        </main>
      </div>

      {/* Footer siempre visible en la parte inferior */}
      <DashboardFooter />

      {/* SessionRefresh componente */}
      <SessionRefresh />
    </div>
  )
}
