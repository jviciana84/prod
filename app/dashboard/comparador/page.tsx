"use client"

import { useState, useCallback } from "react"
import ComparadorTable from "@/components/comparador/comparador-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { Scale } from "lucide-react"

export default function ComparadorPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Comparador de Vehículos</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparativa Inteligente</CardTitle>
          <CardDescription>
            Sube PDFs con los datos de configuración (nombre del archivo = VIN), 
            completa los datos opcionales y obtén una comparación detallada con recomendación automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComparadorTable key={refreshKey} onRefresh={handleRefresh} />
        </CardContent>
      </Card>
    </div>
  )
}

