"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Flag, TrendingDown, TrendingUp, Percent } from "lucide-react"
import { BMWLogo, MINILogo } from "@/components/ui/brand-logos"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mapeo de nombres de concesionario en objetivos a dealership_code en sales_vehicles
// Actualizado: Quadis Munich (nuevo nombre) -> "QM", manteniendo compatibilidad con códigos históricos
const CONCESIONARIO_MAP: { [key: string]: string } = {
  "Quadis Munich": "QM",
  "Motor Munich": "MM",
  "Motor Munich Cadí": "MMC",
}

// Opciones para el selector de periodo (trimestre/semestre) - SOLO Qx y Sx
const periodOptions = [
  { value: "Q1 (Ene-Mar)", label: "Q1" },
  { value: "Q2 (Abr-Jun)", label: "Q2" },
  { value: "Q3 (Jul-Sep)", label: "Q3" },
  { value: "Q4 (Oct-Dic)", label: "Q4" },
  { value: "S1 (Ene-Jun)", label: "S1" },
  { value: "S2 (Jul-Dic)", label: "S2" },
]

interface ObjetivoItem {
  actual: number
  objetivo: number
  tipo: "unidades" | "porcentaje"
}

interface ConcesionData {
  ventaBMW: ObjetivoItem
  ventaMINI: ObjetivoItem
  penetracionFinanciera: ObjetivoItem
}

interface ObjetivosData {
  motorMunich: ConcesionData
  motorMunichCadi: ConcesionData
}

// Helper para obtener el label del trimestre/semestre actual (Qx o Sx)
const getInitialQuarterSemesterLabel = (date: Date) => {
  const month = date.getMonth() // 0-11
  if (month >= 0 && month <= 2) return "Q1 (Ene-Mar)"
  if (month >= 3 && month <= 5) return "Q2 (Abr-Jun)"
  if (month >= 6 && month <= 8) return "Q3 (Jul-Sep)"
  return "Q4 (Oct-Dic)"
}

// Helper para parsear el label del periodo a un rango de fechas Y un label para mostrar
const parsePeriodLabelToDates = (year: number, periodLabel: string) => {
  let startDate: Date
  let endDate: Date
  let displayLabel: string // Label para el subtítulo (ej. "Abril - Junio")

  // Extract the short label (e.g., "Q1", "S1") from the full periodLabel
  const shortPeriodLabel = periodLabel.split(" ")[0]

  if (shortPeriodLabel === "Q1") {
    startDate = new Date(year, 0, 1)
    endDate = new Date(year, 2, 31, 23, 59, 59, 999)
    displayLabel = "Enero - Marzo"
  } else if (shortPeriodLabel === "Q2") {
    startDate = new Date(year, 3, 1)
    endDate = new Date(year, 5, 30, 23, 59, 59, 999)
    displayLabel = "Abril - Junio"
  } else if (shortPeriodLabel === "Q3") {
    startDate = new Date(year, 6, 1)
    endDate = new Date(year, 8, 30, 23, 59, 59, 999)
    displayLabel = "Julio - Septiembre"
  } else if (shortPeriodLabel === "Q4") {
    startDate = new Date(year, 9, 1)
    endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    displayLabel = "Octubre - Diciembre"
  } else if (shortPeriodLabel === "S1") {
    startDate = new Date(year, 0, 1)
    endDate = new Date(year, 5, 30, 23, 59, 59, 999)
    displayLabel = "Enero - Junio"
  } else if (shortPeriodLabel === "S2") {
    startDate = new Date(year, 6, 1)
    endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    displayLabel = "Julio - Diciembre"
  } else {
    // Fallback (debería ser raro con selectores controlados)
    const now = new Date()
    const month = now.getMonth()
    const currentYear = now.getFullYear()
    if (month >= 0 && month <= 2) {
      startDate = new Date(currentYear, 0, 1)
      endDate = new Date(currentYear, 2, 31, 23, 59, 59, 999)
      displayLabel = "Enero - Marzo"
    } else if (month >= 3 && month <= 5) {
      startDate = new Date(currentYear, 3, 1)
      endDate = new Date(currentYear, 5, 30, 23, 59, 59, 999)
      displayLabel = "Abril - Junio"
    } else {
      startDate = new Date(currentYear, 9, 1)
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999)
      displayLabel = "Octubre - Diciembre"
    }
  }
  return { startDate, endDate, displayLabel }
}

export function ObjetivosCard() {
  const now = new Date()
  const initialYear = now.getFullYear()
  const initialQuarterSemester = getInitialQuarterSemesterLabel(now)

  const [objetivos, setObjetivos] = useState<ObjetivosData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(initialYear)
  const [selectedQuarterSemester, setSelectedQuarterSemester] = useState<string>(initialQuarterSemester)
  const [displayPeriodLabel, setDisplayPeriodLabel] = useState<string>("") // Estado para el label del subtítulo

  const supabase = createClientComponentClient()

  const fetchObjetivos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { startDate, endDate, displayLabel } = parsePeriodLabelToDates(selectedYear, selectedQuarterSemester)
      setDisplayPeriodLabel(displayLabel) // Actualizar el label para el subtítulo

      console.log("DEBUG: Año seleccionado:", selectedYear)
      console.log("DEBUG: Periodo seleccionado (Qx/Sx):", selectedQuarterSemester)
      console.log("DEBUG: Rango de fechas para ventas reales:", startDate.toISOString(), "a", endDate.toISOString())

      // 1. Fetch sales objectives for the selected period and year
      const { data: salesObjectivesData, error: salesObjectivesError } = await supabase
        .from("sales_quarterly_objectives")
        .select("*")
        .eq("año", selectedYear)
        .eq("periodo_label", selectedQuarterSemester) // Usar el label exacto seleccionado (Q1, Q2, etc.)

      console.log("DEBUG: sales_quarterly_objectives fetch result:", { salesObjectivesData, salesObjectivesError })
      if (salesObjectivesError) throw salesObjectivesError
      console.log("DEBUG: Objetivos de ventas obtenidos (raw):", salesObjectivesData)
      salesObjectivesData.forEach((obj) => {
        console.log(
          `DEBUG: Procesando Sales Objective - Concesionario: ${obj.concesionario}, Marca: ${obj.marca}, Objetivo (raw): ${obj.objetivo}, Tipo: ${typeof obj.objetivo}`,
        )
      })
      salesObjectivesData.forEach((obj) => {
        console.log(
          `DEBUG: Sales Objective - Concesionario: ${obj.concesionario}, Marca: ${obj.marca}, Objetivo: ${obj.objetivo}`,
        )
      })

      // 2. Fetch financial penetration objectives for the selected year
      // Asumiendo que los objetivos financieros son anuales y no por trimestre/semestre
      const { data: financialObjectivesData, error: financialObjectivesError } = await supabase
        .from("financial_penetration_objectives")
        .select("*")
        .eq("año", selectedYear)

      console.log("DEBUG: financial_penetration_objectives fetch result:", {
        financialObjectivesData,
        financialObjectivesError,
      })
      if (financialObjectivesError) throw financialObjectivesError
      console.log("DEBUG: Objetivos financieros obtenidos (raw):", financialObjectivesData)
      financialObjectivesData.forEach((obj) => {
        console.log(
          `DEBUG: Procesando Financial Objective - Concesionario: ${obj.concesionario}, Objetivo Porcentaje (raw): ${obj.objetivo_porcentaje}, Tipo: ${typeof obj.objetivo_porcentaje}`,
        )
      })
      financialObjectivesData.forEach((obj) => {
        console.log(
          `DEBUG: Financial Objective - Concesionario: ${obj.concesionario}, Objetivo Porcentaje: ${obj.objetivo_porcentaje}`,
        )
      })

      // Initialize the base structure for objectives and actuals
      let finalObjetivos: ObjetivosData = {
        motorMunich: {
          ventaBMW: { actual: 0, objetivo: 0, tipo: "unidades" },
          ventaMINI: { actual: 0, objetivo: 0, tipo: "unidades" },
          penetracionFinanciera: { actual: 0, objetivo: 0, tipo: "porcentaje" },
        },
        motorMunichCadi: {
          ventaBMW: { actual: 0, objetivo: 0, tipo: "unidades" },
          ventaMINI: { actual: 0, objetivo: 0, tipo: "unidades" },
          penetracionFinanciera: { actual: 0, objetivo: 0, tipo: "porcentaje" },
        },
      }

      // Create temporary maps for easier lookup of objectives
      const salesObjectivesMap = new Map<string, number>()
      salesObjectivesData.forEach((obj) => {
        salesObjectivesMap.set(
          `${obj.concesionario}-${obj.marca}-${obj.periodo_label}-${obj.año}`,
          Number(obj.objetivo),
        )
      })

      const financialObjectivesMap = new Map<string, number>()
      financialObjectivesData.forEach((obj) => {
        financialObjectivesMap.set(`${obj.concesionario}-${obj.año}`, Number(obj.objetivo_porcentaje))
      })

      // Populate objectives based on the maps
      Object.keys(finalObjetivos).forEach((concesionarioKey) => {
        const concesionarioName = concesionarioKey === "motorMunich" ? "Motor Munich" : "Motor Munich Cadí"

        // Sales objectives
        const bmwObjective = salesObjectivesMap.get(
          `${concesionarioName}-BMW-${selectedQuarterSemester}-${selectedYear}`,
        )
        console.log(`DEBUG: Retrieved BMW objective for ${concesionarioName}: ${bmwObjective}`)
        if (bmwObjective !== undefined) {
          finalObjetivos[concesionarioKey].ventaBMW.objetivo = bmwObjective
        }

        const miniObjective = salesObjectivesMap.get(
          `${concesionarioName}-MINI-${selectedQuarterSemester}-${selectedYear}`,
        )
        console.log(`DEBUG: Retrieved MINI objective for ${concesionarioName}: ${miniObjective}`)
        if (miniObjective !== undefined) {
          finalObjetivos[concesionarioKey].ventaMINI.objetivo = miniObjective
        }

        // Financial penetration objective
        const financialObjective = financialObjectivesMap.get(`${concesionarioName}-${selectedYear}`)
        console.log(`DEBUG: Retrieved Financial objective for ${concesionarioName}: ${financialObjective}`)
        if (financialObjective !== undefined) {
          finalObjetivos[concesionarioKey].penetracionFinanciera.objetivo = financialObjective
        }
      })

      // 3. Fetch actual sales data for the selected period
      const { data: actualSalesData, error: actualSalesError } = await supabase
        .from("sales_vehicles")
        .select("brand, payment_method, vehicle_type, dealership_code")
        .gte("order_date", startDate.toISOString())
        .lte("order_date", endDate.toISOString())

      console.log("DEBUG: sales_vehicles fetch result:", { actualSalesData, actualSalesError })
      if (actualSalesError) throw actualSalesError
      console.log("DEBUG: Datos de ventas reales obtenidos (raw):", actualSalesData)

      // Calculate actuals per concesionario
      const calculateActuals = (concesionarioName: string) => {
        // Usar el mapeo confirmado por el usuario: "Motor Munich" -> "MM", "Motor Munich Cadí" -> "MMC"
        const dealershipCode = CONCESIONARIO_MAP[concesionarioName]
        if (!dealershipCode) {
          console.warn(
            `DEBUG: No se encontró mapeo para el concesionario: ${concesionarioName}. Asegúrate de que CONCESIONARIO_MAP está configurado correctamente.`,
          )
          return { bmwSales: 0, miniSales: 0, penetration: 0 }
        }

        // Filtrar ventas para el concesionario y EXCLUIR MOTOS
        const salesForConcesionarioCars = actualSalesData.filter(
          (sale) => sale.dealership_code === dealershipCode && sale.vehicle_type !== "Moto",
        )
        console.log(
          `DEBUG: Ventas (solo coches) para ${concesionarioName} (código ${dealershipCode}):`,
          salesForConcesionarioCars,
        )

        const bmwSales = salesForConcesionarioCars.filter((sale) => sale.brand?.toLowerCase().includes("bmw")).length
        const miniSales = salesForConcesionarioCars.filter((sale) => sale.brand?.toLowerCase().includes("mini")).length

        const totalSales = bmwSales + miniSales // Total de coches vendidos para BMW y MINI
        const financedSales = salesForConcesionarioCars.filter((sale) =>
          sale.payment_method?.toLowerCase().includes("financiad"),
        ).length

        const penetration = totalSales > 0 ? (financedSales / totalSales) * 100 : 0

        console.log(
          `DEBUG: Actuals para ${concesionarioName}: BMW Sales: ${bmwSales}, MINI Sales: ${miniSales}, Total Sales: ${totalSales}, Financed Sales: ${financedSales}, Penetration: ${penetration}`,
        )

        return { bmwSales, miniSales, penetration }
      }

      const quadisMunichActuals = calculateActuals("Quadis Munich")

      // Assign actuals to the finalObjetivos structure (immutable update)
      // Ahora solo tenemos Quadis Munich
      finalObjetivos = {
        ...finalObjetivos,
        motorMunich: {
          ...finalObjetivos.motorMunich,
          ventaBMW: { ...finalObjetivos.motorMunich.ventaBMW, actual: quadisMunichActuals.bmwSales },
          ventaMINI: { ...finalObjetivos.motorMunich.ventaMINI, actual: quadisMunichActuals.miniSales },
          penetracionFinanciera: {
            ...finalObjetivos.motorMunich.penetracionFinanciera,
            actual: quadisMunichActuals.penetration,
          },
        },
      }

      console.log(
        "DEBUG: Objetivos procesados FINALES (antes de setObjetivos):",
        JSON.stringify(finalObjetivos, null, 2),
      )
      setObjetivos(finalObjetivos)
    } catch (err) {
      console.error("Error fetching objetivos:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al cargar objetivos")
      setObjetivos(null)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedQuarterSemester]) // Dependencias para re-fetch

  useEffect(() => {
    fetchObjetivos()
  }, [fetchObjetivos])

  const getProgressColor = (label: string) => {
    switch (label) {
      case "Venta BMW":
        return "bg-gradient-to-r from-[#81C4FF] to-[#5A9BD4]" // Light Sky Blue to a darker blue
      case "Venta MINI":
        return "bg-gradient-to-r from-[#16588E] to-[#0F3A5E]" // Yale Blue to a darker Yale Blue
      case "Penetración Financiera":
        return "bg-gradient-to-r from-[#E7222E] to-[#B31B24]" // Alizarin Crimson to a darker red
      default:
        return "bg-gradient-to-r from-[#81C4FF] to-[#5A9BD4]"
    }
  }

  const renderObjetivoItem = (label: string, data: ObjetivoItem, icon?: React.ReactNode) => {
    console.log(`DEBUG: Renderizando item: ${label}, Datos:`, data)
    // Normalizamos valores para evitar errores cuando vengan `null | undefined`
    const actualValue = Number(data.actual ?? 0)
    const objetivoValue = Number(data.objetivo ?? 0)

    console.log(`DEBUG: ${label} - Actual: ${actualValue}, Objetivo: ${objetivoValue}`)

    // Aseguramos que maxValue sea al menos 1 para evitar división por cero
    const maxValue = data.tipo === "porcentaje" ? 100 : Math.max(objetivoValue * 1.2, actualValue * 1.1, 1)

    const progressValue = (actualValue / maxValue) * 100
    const objetivoPosition = (objetivoValue / maxValue) * 100

    console.log(
      `DEBUG: ${label} - MaxValue: ${maxValue}, ProgressValue: ${progressValue}, ObjetivoPosition: ${objetivoPosition}`,
    )

    const diferencia = actualValue - objetivoValue

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-1">
            {diferencia < 0 ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
            <span className={`text-xs font-medium ${diferencia < 0 ? "text-red-500" : "text-green-500"}`}>
              {Math.abs(diferencia).toFixed(data.tipo === "porcentaje" ? 1 : 0)}
              {data.tipo === "porcentaje" ? "%" : ""}
            </span>
          </div>
        </div>

        <div className="relative">
          {/* Barra de progreso más finita */}
          <Progress
            value={progressValue}
            className="h-2 bg-white" // Fondo blanco para la pista
            indicatorClassName={`transition-all duration-700 ease-out ${getProgressColor(label)}`}
          />

          {/* Línea de objetivo simple */}
          <div
            className="absolute top-0 h-2 w-0.5 bg-yellow-500 shadow-sm z-10" // Añadido z-10
            style={{ left: `${objetivoPosition}%` }}
          ></div>

          {/* Número actual encima de la barra de progreso, ajustado */}
          <div className="absolute -top-4 transform -translate-x-1/2 z-20" style={{ left: `${progressValue}%` }}>
            {" "}
            {/* Cambiado a -top-4 */}
            <span className="text-xs font-semibold bg-background/80 px-1 rounded">
              {actualValue.toFixed(data.tipo === "porcentaje" ? 1 : 0)}
              {data.tipo === "porcentaje" ? "%" : ""}
            </span>
          </div>

          {/* Número objetivo encima de la línea de llegada, ajustado */}
          <div className="absolute -top-4 transform -translate-x-1/2 z-20" style={{ left: `${objetivoPosition}%` }}>
            {" "}
            {/* Cambiado a -top-4 */}
            <span className="text-xs font-medium text-yellow-600 bg-background/80 px-1 rounded">
              {objetivoValue.toFixed(data.tipo === "porcentaje" ? 1 : 0)}
              {data.tipo === "porcentaje" ? "%" : ""}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderConcesion = (titulo: string, data: ConcesionData) => {
    console.log(`DEBUG: Renderizando concesión ${titulo} con datos:`, data)
    return (
      <Card className="bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-center">{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderObjetivoItem("Venta BMW", data.ventaBMW, <BMWLogo className="h-4 w-4" />)}
          {renderObjetivoItem("Venta MINI", data.ventaMINI, <MINILogo className="h-4 w-4" />)}
          {renderObjetivoItem("Penetración Financiera", data.penetracionFinanciera, <Percent className="h-4 w-4" />)}
        </CardContent>
      </Card>
    )
  }

  // Generar opciones de año (ej. año actual, 2 años anteriores, 1 año siguiente)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i)

  return (
    <Card className="h-full bg-card">
      <CardHeader className="pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg font-medium text-foreground">Objetivos Ventas</CardTitle>
          </div>
          {/* Subtítulo dinámico con el rango de meses completo */}
          <p className="text-sm text-muted-foreground">
            Objetivos de ventas Retail {displayPeriodLabel} de {selectedYear}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Selector de Año */}
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
            <SelectTrigger className="w-[100px] h-9">
              {" "}
              {/* h-9 para hacerlo más compacto */}
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Selector de Periodo (Trimestre/Semestre) */}
          <Select value={selectedQuarterSemester} onValueChange={setSelectedQuarterSemester}>
            <SelectTrigger className="w-[180px] h-9">
              {" "}
              {/* h-9 para hacerlo más compacto */}
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {console.log(
          "DEBUG: Estado de carga (antes de render):",
          loading,
          "Estado de error (antes de render):",
          error,
          "Objetivos (antes de render):",
          objetivos,
        )}
        {!loading && !error && objetivos && (
          <>
            {console.log(
              "DEBUG: Objetivos object structure before rendering concesiones (JSON):",
              JSON.stringify(objetivos, null, 2),
            )}
            <div className="grid grid-cols-1 gap-4">
              {objetivos.motorMunich && renderConcesion("Quadis Munich", objetivos.motorMunich)}
            </div>
          </>
        )}
        {loading && (
          <div className="grid grid-cols-2 gap-4">
            {Array(2)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="bg-muted/20">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array(3)
                      .fill(0)
                      .map((_, j) => (
                        <div key={j} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-muted-foreground py-4">
            <p>Error al cargar objetivos</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Alias para mantener compatibilidad con otros componentes/páginas
export { ObjetivosCard as SalesObjectivesCard }
