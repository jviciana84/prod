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
      <div className="flex flex-col gap-4">
        <Breadcrumbs
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageOpen className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Entregas</h1>
          </div>
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
      </div>

      <EntregasTable />
    </div>
  )
}
