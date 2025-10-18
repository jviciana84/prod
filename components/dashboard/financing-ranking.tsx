"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PodiumIcon, LaurelIcon } from "@/components/ui/brand-logos"
import { createClientComponentClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface RankingItem {
  id: string // Puede ser UUID o alias
  name: string // Nombre completo o alias
  avatar_url?: string
  financings_count: number
  total_financed_amount: number
  position: number
}

interface HistoricalWinner {
  month: string
  name: string // Este será el alias
  count: number
  year: number
  monthNumber: number
}

interface AnnualRanking {
  name: string // Este será el alias
  count: number
  position: number
}

interface FinancingRankingProps {
  className?: string
}

export function FinancingRanking({ className }: FinancingRankingProps) {
  const [currentRanking, setCurrentRanking] = useState<RankingItem[]>([])
  const [historicalWinners, setHistoricalWinners] = useState<HistoricalWinner[]>([])
  const [annualRanking, setAnnualRanking] = useState<AnnualRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const supabase = useMemo(() => createClientComponentClient(), [])

  useEffect(() => {
    loadRankingData()
  }, [])

  const loadRankingData = async () => {
    try {
      setLoading(true)
      console.log("🔍 Cargando ranking de financiación...")

      // Obtener ranking del mes actual
      const currentDate = new Date()
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()

      // Obtener perfiles para avatares, full_name y alias
      const { data: profilesData } = await supabase.from("profiles").select("id, full_name, avatar_url, alias")

      const profilesMap = new Map() // Key: profile.id (UUID)
      const aliasToProfileMap = new Map() // Key: alias.toLowerCase()
      const fullNameToProfileMap = new Map() // Key: full_name.toLowerCase()

      if (profilesData) {
        profilesData.forEach((profile) => {
          const profileInfo = {
            id: profile.id,
            full_name: profile.full_name,
            alias: profile.alias,
            avatar_url: profile.avatar_url,
          }
          profilesMap.set(profile.id, profileInfo)
          if (profile.alias) {
            aliasToProfileMap.set(profile.alias.toLowerCase(), profileInfo)
          }
          if (profile.full_name) {
            fullNameToProfileMap.set(profile.full_name.toLowerCase(), profileInfo)
          }
        })
      }

      const { data: salesData, error } = await supabase
        .from("sales_vehicles")
        .select(`
          advisor,
          advisor_name,
          advisor_id,
          payment_method,
          price
        `)
        .eq("payment_method", "Financiado")
        .gte("order_date", firstDayOfMonth)

      console.log("📊 Sales data para ranking de financiación:", salesData)
      console.log("⚠️ Error en sales:", error)

      if (!error && salesData && salesData.length > 0) {
        // Contar financiaciones por asesor
        const advisorCounts: Record<
          string,
          { name: string; avatar_url?: string; count: number; totalFinancedAmount: number }
        > = {}

        salesData.forEach((sale) => {
          let profileInfo = null
          let advisorKey = "unknown"

          // Prioridad 1: Usar advisor_id (UUID) si está disponible
          if (sale.advisor_id && profilesMap.has(sale.advisor_id)) {
            profileInfo = profilesMap.get(sale.advisor_id)
            advisorKey = sale.advisor_id
          }
          // Prioridad 2: Usar advisor (alias) si está disponible y no se encontró por ID
          else if (sale.advisor && aliasToProfileMap.has(sale.advisor.toLowerCase())) {
            profileInfo = aliasToProfileMap.get(sale.advisor.toLowerCase())
            advisorKey = profileInfo.id || sale.advisor // Usar ID del perfil si se encontró, sino el alias
          }
          // Prioridad 3: Usar advisor_name (nombre completo) si está disponible y no se encontró por ID o alias
          else if (sale.advisor_name && fullNameToProfileMap.has(sale.advisor_name.toLowerCase())) {
            profileInfo = fullNameToProfileMap.get(sale.advisor_name.toLowerCase())
            advisorKey = profileInfo.id || sale.advisor_name // Usar ID del perfil si se encontró, sino el nombre
          } else {
            // Si no se encuentra un perfil, usar el alias o nombre del registro de venta como clave
            advisorKey = sale.advisor || sale.advisor_name || "Asesor Desconocido"
            profileInfo = {
              full_name: sale.advisor_name || sale.advisor || "Asesor Desconocido",
              alias: sale.advisor || sale.advisor_name || "Desconocido",
              avatar_url: undefined,
            }
          }

          if (!advisorCounts[advisorKey]) {
            advisorCounts[advisorKey] = {
              name: profileInfo.full_name || profileInfo.alias,
              avatar_url: profileInfo.avatar_url,
              count: 0,
              totalFinancedAmount: 0,
            }
          }
          advisorCounts[advisorKey].count++
          advisorCounts[advisorKey].totalFinancedAmount += sale.price || 0
        })

        // Convertir a array y ordenar
        const ranking = Object.entries(advisorCounts)
          .map(([advisor, data]) => ({
            id: advisor,
            name: data.name,
            avatar_url: data.avatar_url,
            financings_count: data.count,
            total_financed_amount: data.totalFinancedAmount,
            position: 0,
          }))
          .sort((a, b) => {
            if (b.financings_count !== a.financings_count) {
              return b.financings_count - a.financings_count
            }
            if (b.total_financed_amount !== a.total_financed_amount) {
              return b.total_financed_amount - a.total_financed_amount
            }
            return a.name.localeCompare(b.name)
          })
          .slice(0, 3)
          .map((item, index) => ({
            ...item,
            position: index + 1,
          }))

        console.log("🏆 Ranking de financiación calculado:", ranking)
        setCurrentRanking(ranking)
        setDebugInfo(`Financiaciones totales: ${salesData.length}, Asesores: ${Object.keys(advisorCounts).length}`)
      } else {
        console.log("❌ No hay datos de financiación este mes")
        setDebugInfo("Sin datos de financiación este mes")
        setCurrentRanking([])
      }

      // HISTORIAL REAL DE GANADORES MENSUALES
      await loadHistoricalWinners(profilesMap, aliasToProfileMap, fullNameToProfileMap)

      // Ranking anual - solo 3 posiciones, datos reales del año
      const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1).toISOString()
      const { data: yearSalesData } = await supabase
        .from("sales_vehicles")
        .select(`
        advisor,
        advisor_name,
        advisor_id,
        payment_method,
        price
      `)
        .eq("payment_method", "Financiado")
        .gte("order_date", firstDayOfYear)

      if (yearSalesData && yearSalesData.length > 0) {
        const yearAdvisorCounts: Record<string, { name: string; count: number; totalAmount: number }> = {}

        yearSalesData.forEach((sale) => {
          let profileInfo = null
          let advisorKey = "unknown"

          if (sale.advisor_id && profilesMap.has(sale.advisor_id)) {
            profileInfo = profilesMap.get(sale.advisor_id)
            advisorKey = sale.advisor_id
          } else if (sale.advisor && aliasToProfileMap.has(sale.advisor.toLowerCase())) {
            profileInfo = aliasToProfileMap.get(sale.advisor.toLowerCase())
            advisorKey = profileInfo.id || sale.advisor
          } else if (sale.advisor_name && fullNameToProfileMap.has(sale.advisor_name.toLowerCase())) {
            profileInfo = fullNameToProfileMap.get(sale.advisor_name.toLowerCase())
            advisorKey = profileInfo.id || sale.advisor_name
          } else {
            advisorKey = sale.advisor || sale.advisor_name || "Asesor Desconocido"
            profileInfo = {
              full_name: sale.advisor_name || sale.advisor || "Asesor Desconocido",
              alias: sale.advisor || sale.advisor_name || "Desconocido",
            }
          }

          if (!yearAdvisorCounts[advisorKey]) {
            yearAdvisorCounts[advisorKey] = {
              name: profileInfo.alias || profileInfo.full_name,
              count: 0,
              totalAmount: 0,
            }
          }
          yearAdvisorCounts[advisorKey].count++
          yearAdvisorCounts[advisorKey].totalAmount += sale.price || 0
        })

        const yearRanking = Object.entries(yearAdvisorCounts)
          .map(([advisor, data]) => ({
            name: data.name,
            count: data.count,
            totalAmount: data.totalAmount,
            position: 0,
          }))
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count
            if (b.totalAmount !== a.totalAmount) return b.totalAmount - a.totalAmount
            return a.name.localeCompare(b.name)
          })
          .slice(0, 3)
          .map((item, index) => ({
            ...item,
            position: index + 1,
          }))

        setAnnualRanking(yearRanking)
      } else {
        setAnnualRanking([])
      }
    } catch (error) {
      console.error("💥 Error cargando ranking de financiación:", error)
      setDebugInfo(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const loadHistoricalWinners = async (
    profilesMap: Map<any, any>,
    aliasToProfileMap: Map<any, any>,
    fullNameToProfileMap: Map<any, any>,
  ) => {
    try {
      console.log("📅 Cargando historial de ganadores mensuales de financiación...")

      const currentDate = new Date()
      const winners: HistoricalWinner[] = []

      // Obtener los últimos 6 meses (incluyendo el actual)
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString()
        const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59).toISOString()

        console.log(
          `📊 Analizando mes (Financiación): ${targetDate.getFullYear()}-${targetDate.getMonth() + 1} (del ${firstDay} al ${lastDay})`,
        )

        const { data: monthSalesData, error: monthSalesError } = await supabase
          .from("sales_vehicles")
          .select(`
          advisor,
          advisor_name,
          advisor_id,
          payment_method,
          price
        `)
          .eq("payment_method", "Financiado")
          .gte("order_date", firstDay)
          .lte("order_date", lastDay)

        if (monthSalesError) {
          console.error(
            `❌ Error fetching sales data for ${targetDate.getMonth() + 1}/${targetDate.getFullYear()} (Financiación):`,
            monthSalesError,
          )
          winners.push({
            month: targetDate.toLocaleDateString("es-ES", { month: "short" }),
            name: "Error",
            count: 0,
            year: targetDate.getFullYear(),
            monthNumber: targetDate.getMonth() + 1,
          })
          continue // Skip to next month
        }

        console.log(
          `Fetched ${monthSalesData?.length || 0} sales for ${targetDate.getMonth() + 1}/${targetDate.getFullYear()} (Financiación)`,
        )

        if (monthSalesData && monthSalesData.length > 0) {
          // Contar financiaciones por asesor para este mes
          const monthAdvisorCounts: Record<string, { name: string; count: number; totalAmount: number }> = {}

          monthSalesData.forEach((sale) => {
            let profileInfo = null
            let advisorKey = "unknown"

            // Prioridad 1: Usar advisor_id (UUID) si está disponible
            if (sale.advisor_id && profilesMap.has(sale.advisor_id)) {
              profileInfo = profilesMap.get(sale.advisor_id)
              advisorKey = sale.advisor_id
            }
            // Prioridad 2: Usar advisor (alias) si está disponible y no se encontró por ID
            else if (sale.advisor && aliasToProfileMap.has(sale.advisor.toLowerCase())) {
              profileInfo = aliasToProfileMap.get(sale.advisor.toLowerCase())
              advisorKey = profileInfo.id || sale.advisor
            }
            // Prioridad 3: Usar advisor_name (nombre completo) si está disponible y no se encontró por ID o alias
            else if (sale.advisor_name && fullNameToProfileMap.has(sale.advisor_name.toLowerCase())) {
              profileInfo = fullNameToProfileMap.get(sale.advisor_name.toLowerCase())
              advisorKey = profileInfo.id || sale.advisor_name
            } else {
              advisorKey = sale.advisor || sale.advisor_name || "Asesor Desconocido"
              profileInfo = {
                full_name: sale.advisor_name || sale.advisor || "Asesor Desconocido",
                alias: sale.advisor || sale.advisor_name || "Desconocido",
              }
            }

            if (!monthAdvisorCounts[advisorKey]) {
              monthAdvisorCounts[advisorKey] = {
                name: profileInfo.alias || profileInfo.full_name,
                count: 0,
                totalAmount: 0,
              }
            }
            monthAdvisorCounts[advisorKey].count++
            monthAdvisorCounts[advisorKey].totalAmount += sale.price || 0
          })

          console.log(
            `Month Advisor Counts for ${targetDate.getMonth() + 1}/${targetDate.getFullYear()} (Financiación):`,
            monthAdvisorCounts,
          )

          // Encontrar el ganador del mes
          const monthWinner = Object.entries(monthAdvisorCounts)
            .map(([advisor, data]) => ({
              advisor,
              name: data.name,
              count: data.count,
              totalAmount: data.totalAmount,
            }))
            .sort((a, b) => {
              if (b.count !== a.count) return b.count - a.count
              if (b.totalAmount !== a.totalAmount) return b.totalAmount - a.totalAmount
              return a.name.localeCompare(b.name)
            })[0]

          if (monthWinner) {
            winners.push({
              month: targetDate.toLocaleDateString("es-ES", { month: "short" }),
              name: monthWinner.name,
              count: monthWinner.count,
              year: targetDate.getFullYear(),
              monthNumber: targetDate.getMonth() + 1,
            })
          }
        } else {
          // Si no hay datos para el mes, agregar entrada vacía
          winners.push({
            month: targetDate.toLocaleDateString("es-ES", { month: "short" }),
            name: "--",
            count: 0,
            year: targetDate.getFullYear(),
            monthNumber: targetDate.getMonth() + 1,
          })
        }
      }

      // Ordenar por año y mes (más reciente primero)
      winners.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.monthNumber - a.monthNumber
      })

      console.log("🏆 Historial de ganadores de financiación cargado:", winners)
      setHistoricalWinners(winners)
    } catch (error) {
      console.error("❌ Error cargando historial de ganadores de financiación:", error)
    }
  }

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-yellow-500"
      case 2:
        return "text-gray-400"
      case 3:
        return "text-amber-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getPodiumBg = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20"
      case 2:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20"
      case 3:
        return "bg-amber-50 border-amber-200 dark:bg-amber-900/20"
      default:
        return "bg-background"
    }
  }

  // Formateador de moneda
  const currencyFormatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PodiumIcon className="h-5 w-5 text-yellow-500" />
            Ranking Financiación
          </CardTitle>
          <CardDescription>Resultados del último mes</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <PodiumIcon className="h-5 w-5 text-yellow-500" />
          Ranking Financiación
        </CardTitle>
        <CardDescription>Resultados mes en curso</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-3">
          {currentRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay datos de financiación este mes</p>
          ) : (
            currentRanking.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getPodiumBg(item.position)}`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={item.avatar_url || "/placeholder.svg"} alt={item.name} />
                    <AvatarFallback>{item.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${getPodiumColor(item.position)} bg-background border-2 border-current flex items-center justify-center text-xs font-bold`}
                  >
                    {item.position}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">{item.name}</p> {/* Full Name aquí */}
                  <p className="text-xs text-muted-foreground">
                    {item.financings_count} financiaciones • {currencyFormatter.format(item.total_financed_amount)}
                  </p>
                </div>
                {item.position === 1 && <Badge className="bg-yellow-500 text-white">🏆</Badge>}
                {item.position === 2 && <Badge variant="secondary">🥈</Badge>}
                {item.position === 3 && <Badge variant="outline">🥉</Badge>}
              </div>
            ))
          )}
        </div>

        {/* Historial mensual y ranking anual */}
        {(historicalWinners.length > 0 || annualRanking.length > 0) && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campeones mensuales */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <LaurelIcon className="h-4 w-4 text-yellow-500" />
                  Campeones Mensuales
                </h4>
                <div className="space-y-2">
                  {historicalWinners.slice(0, 5).map((winner, index) => (
                    <div
                      key={`${winner.year}-${winner.monthNumber}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-8">{winner.month}</span>
                        <span className={winner.name === "--" ? "text-muted-foreground" : ""}>{winner.name}</span>{" "}
                        {/* Alias aquí */}
                      </div>
                      <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                        {winner.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ranking anual - solo 3 posiciones */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <PodiumIcon className="h-4 w-4 text-amber-500" />
                  Ranking Anual
                </h4>
                <div className="space-y-2">
                  {annualRanking.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin datos anuales</p>
                  ) : (
                    annualRanking.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className={`font-bold w-4 ${getPodiumColor(item.position)}`}>#{item.position}</span>
                        <span>{item.name}</span> {/* Alias aquí */}
                        <Badge
                          variant={item.position <= 3 ? "default" : "outline"}
                          className={`text-xs px-2 py-0 h-5 ${
                            item.position === 1
                              ? "bg-yellow-500 text-white"
                              : item.position === 2
                                ? "bg-gray-400 text-white"
                                : item.position === 3
                                  ? "bg-amber-600 text-white"
                                  : ""
                          }`}
                        >
                          {item.count}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug info */}
        <div className="mt-4 text-xs text-muted-foreground text-left font-mono">
          <p>Debug: {debugInfo}</p>
        </div>
      </CardContent>
    </Card>
  )
}
