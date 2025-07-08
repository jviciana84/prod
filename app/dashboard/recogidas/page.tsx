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
      <div className="flex flex-col gap-4">
        <Breadcrumbs
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Solicitar Recogida</h1>
          </div>
        </div>
      </div>

      <RecogidasManager preselectedMatricula={searchParams.matricula} />
    </div>
  )
} 