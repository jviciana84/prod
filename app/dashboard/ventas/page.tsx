"use client"

import { useState } from "react"
import { SalesQuickForm } from "@/components/sales/sales-quick-form"
import SalesTable from "@/components/sales/sales-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Wrench, TableIcon, FileText } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VentasPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSaleRegistered = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-green-500" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight">Gestión Vehículos Vendidos</h1>
              <Link href="/dashboard/ventas/upload-pdf">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Subir PDF</span>
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground">Control y seguimiento de ventas completadas y en proceso</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Wrench className="mr-2 h-4 w-4 text-blue-500" />
            Registro de Ventas
          </CardTitle>
          <CardDescription>Registra nuevas ventas de vehículos</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesQuickForm onSaleRegistered={handleSaleRegistered} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <TableIcon className="mr-2 h-4 w-4 text-blue-500" />
            Vehículos Vendidos
          </CardTitle>
          <CardDescription>Seguimiento y gestión de vehículos vendidos</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <SalesTable key={refreshKey} />
        </CardContent>
      </Card>
    </div>
  )
}
