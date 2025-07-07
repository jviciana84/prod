import { IncentivosTable } from "@/components/incentivos/incentivos-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Euro } from "lucide-react"
import Link from "next/link"

export default function IncentivosPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Euro className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Gestión de Incentivos</h1>
            <p className="text-muted-foreground">Administra y calcula los incentivos de ventas</p>
          </div>
        </div>
        <Link href="/incentivos/config">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración de Incentivos
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Tabla de Incentivos
          </CardTitle>
          <CardDescription>Visualiza y gestiona todos los incentivos calculados automáticamente</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <IncentivosTable />
        </CardContent>
      </Card>
    </div>
  )
}
