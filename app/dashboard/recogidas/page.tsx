import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { RecogidasManager } from "@/components/recogidas/recogidas-manager"
import { Truck, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
      <div className="space-y-4">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Solicitar Recogida</h1>
              <p className="text-muted-foreground">Gestión de envío de documentación por mensajería</p>
            </div>
          </div>
          <Link href="/dashboard/recogidas/configuracion">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
          </Link>
        </div>
      </div>
      <RecogidasManager preselectedMatricula={searchParams.matricula} />
    </div>
  )
} 