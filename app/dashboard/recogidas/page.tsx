import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { RecogidasManager } from "@/components/recogidas/recogidas-manager"
import { Truck } from "lucide-react"

export const metadata: Metadata = {
  title: "Solicitar Recogida | Dashboard",
  description: "Gestión de envío de documentación por mensajería",
}

interface RecogidasPageProps {
  searchParams: { matricula?: string }
}

export default function RecogidasPage({ searchParams }: RecogidasPageProps) {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4"
          segments={[
            {
              title: "Dashboard",
              href: "/dashboard",
            },
            {
              title: "Solicitar Recogida",
              href: "/dashboard/recogidas",
            },
          ]}
        />
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Solicitar Recogida</h1>
            <p className="text-muted-foreground">Gestión de envío de documentación por mensajería</p>
          </div>
        </div>
      </div>
      <RecogidasManager preselectedMatricula={searchParams.matricula} />
    </div>
  )
} 