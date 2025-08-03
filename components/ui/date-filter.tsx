"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export interface DateFilterProps {
  onDateFilterChange: (from: Date | undefined, to: Date | undefined) => void
  dateFilter: {
    from: Date | undefined
    to: Date | undefined
  }
  title?: string
  description?: string
  fieldName?: string
}

export function DateFilter({ 
  onDateFilterChange, 
  dateFilter, 
  title = "Filtrar por fecha",
  description = "Selecciona un rango de fechas para filtrar",
  fieldName = "fecha"
}: DateFilterProps) {
  const [showDateFilter, setShowDateFilter] = useState(false)
  
  const quickFilters = [
    { label: "Hoy", days: 0 },
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
  ]

  const applyQuickFilter = (days: number) => {
    const today = new Date()
    const from = days === 0 ? today : new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    onDateFilterChange(from, today)
  }

  const clearDateFilter = () => {
    onDateFilterChange(undefined, undefined)
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowDateFilter(true)}
        className={cn(
          "h-9 w-9",
          (dateFilter.from || dateFilter.to) && "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
        )}
        title="Filtrar por fecha"
      >
        <Calendar className="h-4 w-4" />
      </Button>

      {/* Modal de filtro de fechas */}
      <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Filtros rápidos */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Filtros rápidos</Label>
              <div className="grid grid-cols-2 gap-3">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.days}
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickFilter(filter.days)}
                    className="justify-start h-10"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O selecciona un rango personalizado</span>
              </div>
            </div>

            {/* Fechas personalizadas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-date" className="text-sm font-medium">
                  Desde
                </Label>
                <Input
                  id="from-date"
                  type="date"
                  value={dateFilter.from?.toISOString().split("T")[0] || ""}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    onDateFilterChange(date, dateFilter.to)
                  }}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-date" className="text-sm font-medium">
                  Hasta
                </Label>
                <Input
                  id="to-date"
                  type="date"
                  value={dateFilter.to?.toISOString().split("T")[0] || ""}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    onDateFilterChange(dateFilter.from, date)
                  }}
                  className="h-10"
                />
              </div>
            </div>

            {/* Indicador de filtro activo */}
            {(dateFilter.from || dateFilter.to) && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 dark:text-blue-300">
                    Filtro activo: {dateFilter.from?.toLocaleDateString()} - {dateFilter.to?.toLocaleDateString() || "Hoy"}
                  </span>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={clearDateFilter}
                className="h-10 px-4"
              >
                Limpiar filtro
              </Button>
              <Button 
                onClick={() => setShowDateFilter(false)}
                className="h-10 px-6"
              >
                Aplicar filtro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 