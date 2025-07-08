import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { EntregasTable } from "@/components/entregas/entregas-table"
import { PackageOpen, BarChart3 } from "lucide-react"
import { SyncEntregasButton } from "@/components/entregas/sync-button"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Entregas | Dashboard",
  description: "Gestión de entregas de vehículos",
}

export default function EntregasPage() {
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
              title: "Entregas",
              href: "/dashboard/entregas",
            },
          ]}
        />
        <div className="flex items-center gap-3">
          <PackageOpen className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">Entregas</h1>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/entregas/informes" passHref>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Informes de Incidencias
                  </Button>
                </Link>
                <SyncEntregasButton />
              </div>
            </div>
            <p className="text-muted-foreground">Gestión de entregas de vehículos</p>
          </div>
        </div>
      </div>

      <EntregasTable />
    </div>
  )
}
