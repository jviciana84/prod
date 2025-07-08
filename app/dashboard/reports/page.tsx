import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileBarChart, FileText, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Informes | Dashboard",
  description: "Informes y reportes del sistema",
}

export default function ReportsPage() {
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
              title: "Informes",
              href: "/dashboard/reports",
            },
          ]}
        />
        <div className="flex items-center gap-3">
          <FileBarChart className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Informes y Reportes</h1>
            <p className="text-muted-foreground">Informes y reportes del sistema</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Informe de Entregas</CardTitle>
            <CardDescription>Estadísticas y datos sobre entregas de vehículos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Accede a información detallada sobre las entregas realizadas, incluyendo estadísticas por fecha, usuario y
              estado.
            </p>
            <Link href="/dashboard/entregas/informes">
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Ver Informe
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informe de Incidencias</CardTitle>
            <CardDescription>Análisis de incidencias registradas en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualiza datos sobre incidencias reportadas, tiempos de resolución y tipos más frecuentes.
            </p>
            <Link href="/dashboard/entregas/informes">
              <Button variant="outline" className="w-full">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Ver Informe
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informe de Stock</CardTitle>
            <CardDescription>Estado actual del inventario de vehículos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consulta información sobre el stock actual, rotación de vehículos y estadísticas de permanencia.
            </p>
            <Link href="/dashboard/vehicles/stats">
              <Button variant="outline" className="w-full">
                <FileBarChart className="mr-2 h-4 w-4" />
                Ver Informe
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
