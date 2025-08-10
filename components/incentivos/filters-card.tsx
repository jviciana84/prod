"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter, Copy, Check, Calendar, CalendarDays, User, ListFilter } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getUniqueYearsAndMonths, getUniqueAdvisors } from "@/server-actions/incentivos-actions"
import type { Incentivo } from "@/types/incentivos"

interface FiltersCardProps {
  displayIncentives: Incentivo[]
  onFilterChange: (filters: {
    year: string | null
    month: string | null
    advisor: string | null
    mode: "pending" | "historical"
  }) => void
  currentFilterMode: "pending" | "historical"
  currentSelectedYear: string | null
  currentSelectedMonth: string | null
  currentSelectedAdvisor: string | null
}

export function FiltersCard({
  displayIncentives,
  onFilterChange,
  currentFilterMode,
  currentSelectedYear,
  currentSelectedMonth,
  currentSelectedAdvisor,
}: FiltersCardProps) {
  const [years, setYears] = useState<string[]>([])
  const [months, setMonths] = useState<string[]>([])
  const [advisors, setAdvisors] = useState<string[]>([])
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    const fetchFilterData = async () => {
      const { years: uniqueYears, months: uniqueMonths } = await getUniqueYearsAndMonths()
      setYears(uniqueYears)
      setMonths(uniqueMonths)

      const uniqueAdvisors = await getUniqueAdvisors()
      setAdvisors(uniqueAdvisors)
    }
    fetchFilterData()
  }, [])

  const handleMonthChange = (value: string) => {
    const newMonth = value === "all" ? null : value
    onFilterChange({
      year: currentSelectedYear,
      month: newMonth,
      advisor: currentSelectedAdvisor,
      mode: currentFilterMode,
    })
  }

  const handleYearChange = (value: string) => {
    const newYear = value === "all" ? null : value
    onFilterChange({
      year: newYear,
      month: currentSelectedMonth,
      advisor: currentSelectedAdvisor,
      mode: currentFilterMode,
    })
  }

  const handleAdvisorChange = (value: string) => {
    const newAdvisor = value === "all" ? null : value
    onFilterChange({
      year: currentSelectedYear,
      month: currentSelectedMonth,
      advisor: newAdvisor,
      mode: currentFilterMode,
    })
  }

  const handleModeChange = (value: string) => {
    const newMode = value as "pending" | "historical"
    onFilterChange({
      year: currentSelectedYear,
      month: currentSelectedMonth,
      advisor: currentSelectedAdvisor,
      mode: newMode,
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  const getMonthName = (monthNumber: string) => {
    const months = {
      "1": "Enero",
      "2": "Febrero", 
      "3": "Marzo",
      "4": "Abril",
      "5": "Mayo",
      "6": "Junio",
      "7": "Julio",
      "8": "Agosto",
      "9": "Septiembre",
      "10": "Octubre",
      "11": "Noviembre",
      "12": "Diciembre"
    }
    return months[monthNumber as keyof typeof months] || monthNumber
  }

  const handleCopyData = () => {
    if (displayIncentives.length === 0) {
      toast.error("No hay datos para copiar.")
      return
    }

    // Solo las columnas específicas que aparecen en la tabla de pendientes de gastos
    const headers = [
      "ENTREGA",
      "MATRÍCULA", 
      "OR",
      "ASESOR",
      "GARANTÍA",
      "GASTOS 360º"
    ].join("\t")

    const dataToCopy = displayIncentives
      .map((incentivo) => {
        return [
          formatDate(incentivo.fecha_entrega) || "",
          incentivo.matricula || "",
          incentivo.or || "",
          incentivo.asesor || "",
          incentivo.garantia === 0 ? "Fabricante" : incentivo.garantia?.toString() || "",
          incentivo.gastos_360?.toString() || "",
        ].join("\t")
      })
      .join("\n")

    const fullText = `${headers}\n${dataToCopy}`

    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        setIsCopied(true)
        toast.success("Datos copiados al portapapeles (formato Excel).")
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        toast.error("Error al copiar los datos.")
      })
  }

  return (
    <Card className="rounded-xl border shadow-sm h-full flex flex-col">
      <CardHeader className="pb-6 px-8 pt-8">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
          <Filter className="h-6 w-6 text-blue-500" />
          Filtros y Acciones
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Gestiona los filtros para visualizar los incentivos
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="filter-mode"
                className="text-sm font-medium text-muted-foreground flex items-center gap-1"
              >
                <ListFilter className="h-4 w-4" /> Modo
              </label>
              <Select onValueChange={handleModeChange} value={currentFilterMode}>
                <SelectTrigger id="filter-mode" className="w-full">
                  <SelectValue placeholder="Seleccionar modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="historical">Histórico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="advisor-filter"
                className="text-sm font-medium text-muted-foreground flex items-center gap-1"
              >
                <User className="h-4 w-4" /> Asesor
              </label>
              <Select onValueChange={handleAdvisorChange} value={currentSelectedAdvisor || ""}>
                <SelectTrigger id="advisor-filter" className="w-full">
                  <SelectValue placeholder="Seleccionar asesor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los asesores</SelectItem>
                  {advisors.map((advisor) => (
                    <SelectItem key={advisor} value={advisor}>
                      {advisor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(currentFilterMode === "historical" || currentFilterMode === "pending") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    htmlFor="year-filter"
                    className="text-sm font-medium text-muted-foreground flex items-center gap-1"
                  >
                    <Calendar className="h-4 w-4" /> Año
                  </label>
                  <Select onValueChange={handleYearChange} value={currentSelectedYear || ""}>
                    <SelectTrigger id="year-filter" className="w-full">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="month-filter"
                    className="text-sm font-medium text-muted-foreground flex items-center gap-1"
                  >
                    <CalendarDays className="h-4 w-4" /> Mes
                  </label>
                  <Select onValueChange={handleMonthChange} value={currentSelectedMonth || ""}>
                    <SelectTrigger id="month-filter" className="w-full">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {getMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleCopyData} className="w-full gap-2">
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copiar Datos
          </Button>

          {/* Contador visual de filas */}
          <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-full">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Incentivos {currentFilterMode === "pending" ? "Pendientes" : "Históricos"}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Filtros aplicados
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {displayIncentives.length}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {displayIncentives.length === 1 ? "registro" : "registros"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Removido el contador simple anterior */}
      </CardContent>
    </Card>
  )
}
