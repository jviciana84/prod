import { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { RecogidasEmailConfig } from "@/components/recogidas/recogidas-email-config"

export const metadata: Metadata = {
  title: "Configuración de Emails - Recogidas",
  description: "Configuración de emails para el sistema de recogidas",
}

export default function RecogidasConfigPage() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-4">
        <Breadcrumbs className="mt-4"
          segments={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Recogidas", href: "/dashboard/recogidas" },
            { title: "Configuración", href: "/dashboard/recogidas/configuracion" },
          ]}
        />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración de Emails</h1>
            <p className="text-muted-foreground">Configuración de emails para el sistema de recogidas</p>
          </div>
        </div>
      </div>
      <RecogidasEmailConfig />
    </div>
  )
} 