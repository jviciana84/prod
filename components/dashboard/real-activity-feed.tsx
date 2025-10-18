"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Plus, Clock, Activity, CreditCard, Banknote, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils" // Import cn for conditional class names

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  created_at: string
  icon: any
  color: string
  badge?: string
  user_name?: string
  user_avatar?: string
  dealership?: string
  payment_method?: string
  price?: number
}

interface RealActivityFeedProps {
  className?: string
}

export function RealActivityFeed({ className }: RealActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const supabase = useMemo(() => createClientComponentClient(), [])

  useEffect(() => {
    loadRecentActivity()
  }, [])

  // Helper function to resolve asesor names from profiles table
  const resolveAsesorName = async (asesorAlias: string | null | undefined): Promise<string> => {
    if (!asesorAlias) return "Asesor Desconocido"

    console.log(`DEBUG: resolveAsesorName input: "${asesorAlias}"`)

    // If it looks like a full name (contains space) or is a static label, return directly
    if (asesorAlias.includes(" ") || ["Comercial", "Sistema", "Taller"].includes(asesorAlias)) {
      console.log(`DEBUG: resolveAsesorName returning static/full name: "${asesorAlias}"`)
      return asesorAlias
    }

    try {
      // First, try to find by alias
      const { data: profileByAlias, error: aliasError } = await supabase
        .from("profiles")
        .select("full_name")
        .ilike("alias", asesorAlias)
        .limit(1) // Use limit(1) to handle potential non-unique aliases gracefully

      if (aliasError) {
        console.warn(`⚠️ Error fetching by alias ${asesorAlias}:`, aliasError.message)
      } else if (profileByAlias && profileByAlias.length > 0) {
        console.log(`DEBUG: Found full_name "${profileByAlias[0].full_name}" for alias "${asesorAlias}"`)
        return profileByAlias[0].full_name
      } else {
        console.log(`DEBUG: No profile found for alias "${asesorAlias}". Trying full_name fallback.`)
        // Fallback: if no alias match, try matching by full_name (in case asesor field sometimes contains full name)
        const { data: fullNameData, error: fullNameError } = await supabase
          .from("profiles")
          .select("full_name")
          .ilike("full_name", asesorAlias)
          .limit(1)

        if (fullNameError) {
          console.warn(`⚠️ Error fetching full name for full_name ${asesorAlias}:`, fullNameError.message)
        } else if (fullNameData && fullNameData.length > 0) {
          console.log(`DEBUG: Found full_name "${fullNameData[0].full_name}" for full_name match "${asesorAlias}"`)
          return fullNameData[0].full_name
        }
      }
    } catch (err) {
      console.error(`💥 Error in resolveAsesorName for ${asesorAlias}:`, err)
    }

    console.log(`DEBUG: No match found for "${asesorAlias}". Returning original alias.`)
    return asesorAlias // Fallback to original alias if nothing found
  }

  const loadRecentActivity = async () => {
    try {
      setLoading(true)
      console.log("🔍 Cargando actividad reciente...")
      const activities: ActivityItem[] = []
      const debug: string[] = []

      // 1. Vehículos vendidos con información corregida
      try {
        const { data: salesData, error: salesError } = await supabase
          .from("sales_vehicles")
          .select("id, created_at, license_plate, model, price, payment_method, advisor, advisor_name")
          .order("created_at", { ascending: false })
          .limit(10) // Aumentado el límite

        if (salesError) {
          console.log("⚠️ Error en sales_vehicles:", salesError.message)
          debug.push(`Sales error: ${salesError.message}`)
        } else if (salesData && salesData.length > 0) {
          console.log("✅ Sales encontradas:", salesData.length)
          debug.push(`Sales: ${salesData.length} items`)
          for (const sale of salesData) {
            const isFinanced = sale.payment_method === "Financiado"
            activities.push({
              id: `sale_${sale.id}`,
              type: "sale",
              title: "Vehículo vendido",
              description: `${sale.model || "Modelo"} - ${sale.license_plate}`,
              created_at: sale.created_at,
              icon: isFinanced ? CreditCard : Banknote,
              color: isFinanced ? "text-blue-500" : "text-green-500",
              badge: sale.payment_method || "Vendido",
              user_name: await resolveAsesorName(sale.advisor_name || sale.advisor),
              payment_method: sale.payment_method,
              price: sale.price,
            })
          }
        } else {
          debug.push("Sales: sin datos")
        }
      } catch (err) {
        console.log("⚠️ Tabla sales_vehicles no accesible:", err)
        debug.push("Sales: no accesible")
      }

      // 2. Stock (nuevas entradas) - usando columnas correctas
      try {
        const { data: stockData, error: stockError } = await supabase
          .from("stock")
          .select("id, created_at, license_plate, model")
          .order("created_at", { ascending: false })
          .limit(10) // Aumentado el límite

        if (stockError) {
          console.log("⚠️ Error en stock:", stockError.message)
          debug.push(`Stock error: ${stockError.message}`)
        } else if (stockData && stockData.length > 0) {
          console.log("✅ Stock encontrado:", stockData.length)
          debug.push(`Stock: ${stockData.length} items`)
          stockData.forEach((item) => {
            activities.push({
              id: `stock_${item.id}`,
              type: "stock",
              title: "Nuevo en stock",
              description: `${item.model || "Modelo"} - ${item.license_plate}`,
              created_at: item.created_at,
              icon: Plus,
              color: "text-blue-500",
              badge: "Stock",
            })
          })
        } else {
          debug.push("Stock: sin datos")
        }
      } catch (err) {
        console.log("⚠️ Tabla stock no accesible:", err)
        debug.push("Stock: no accesible")
      }

      // 3. Entregas (Vehículos Entregados) - cuando fecha_entrega NO es nula
      try {
        const { data: entregasDeliveredData, error: entregasDeliveredError } = await supabase
          .from("entregas")
          .select("id, created_at, matricula, fecha_entrega, asesor")
          .not("fecha_entrega", "is", null) // Solo si fecha_entrega tiene valor
          .order("fecha_entrega", { ascending: false }) // Cambiar a fecha_entrega para ordenar por fecha real de entrega
          .limit(15) // Aumentar límite para asegurar que aparezcan

        if (entregasDeliveredError) {
          console.log("⚠️ Error en entregas (delivered):", entregasDeliveredError.message)
          debug.push(`Entregas delivered error: ${entregasDeliveredError.message}`)
        } else if (entregasDeliveredData && entregasDeliveredData.length > 0) {
          console.log("✅ Entregas (delivered) encontradas:", entregasDeliveredData.length)
          debug.push(`Entregas delivered: ${entregasDeliveredData.length} items`)
          
          // Log específico para las entregas que buscamos
          const entregasEspecificas = entregasDeliveredData.filter(e => 
            e.matricula === '1813LVR' || e.matricula === '9532LMN'
          )
          if (entregasEspecificas.length > 0) {
            console.log("🎯 ENCONTRADAS LAS ENTREGAS ESPECÍFICAS:", entregasEspecificas)
          } else {
            console.log("❌ NO SE ENCONTRARON LAS ENTREGAS 1813LVR y 9532LMN en los resultados")
          }
          
          for (const entrega of entregasDeliveredData) {
            // Changed to for...of to use await
            console.log(`DEBUG Entrega Entregada: Matrícula: ${entrega.matricula}, Fecha Entrega: ${entrega.fecha_entrega}, Created: ${entrega.created_at}`)
            activities.push({
              id: `delivered_${entrega.id}`,
              type: "entrega",
              title: "Vehículo entregado",
              description: `Matrícula: ${entrega.matricula}`,
              created_at: entrega.created_at,
              icon: CheckCircle,
              color: "text-emerald-500",
              badge: "Entregas",
              user_name: await resolveAsesorName(entrega.asesor),
            })
          }
        } else {
          debug.push("Entregas delivered: sin datos")
        }
      } catch (err) {
        console.log("⚠️ Tabla entregas (delivered) no accesible:", err)
        debug.push("Entregas delivered: no accesible")
      }

      // 4. Entregas (Vehículos Certificados) - por la creación del registro en entregas, usando la columna modelo
      try {
        const { data: entregasCertifiedData, error: entregasCertifiedError } = await supabase
          .from("entregas")
          .select("id, created_at, matricula, asesor, modelo")
          .order("created_at", { ascending: false })
          .limit(10) // Aumentado el límite

        if (entregasCertifiedError) {
          console.log("⚠️ Error en Fin Certificación:", entregasCertifiedError.message)
          debug.push(`Fin Certificación error: ${entregasCertifiedError.message}`)
        } else if (entregasCertifiedData && entregasCertifiedData.length > 0) {
          console.log("✅ Fin Certificación encontradas:", entregasCertifiedData.length)
          debug.push(`Fin Certificación: ${entregasCertifiedData.length} items`)
          for (const entrega of entregasCertifiedData) {
            const model = (entrega as any).modelo || ""
            let certifiedBadge = "Fin Certificación" // Default badge

            console.log(`DEBUG Certificación: Modelo: "${model}" (raw)`)
            console.log(`DEBUG Entrega Certificada: Matrícula: ${entrega.matricula}, Fecha: ${entrega.created_at}`)

            const lowerCaseModel = model.toLowerCase()

            if (lowerCaseModel.includes("bmw motorrad")) {
              certifiedBadge = "BMW Certified Used Bikes"
            } else if (
              lowerCaseModel.includes("mini") ||
              lowerCaseModel.includes("countryman") ||
              lowerCaseModel.includes("cooper")
            ) {
              certifiedBadge = "MINI Next"
            } else if (lowerCaseModel.includes("bmw") || model.length > 0) {
              certifiedBadge = "BMW Premium Selection"
            }

            console.log(`DEBUG Certificación: Asignado badge: "${certifiedBadge}" para modelo: "${model}"`)

            activities.push({
              id: `certified_${entrega.id}`,
              type: "certificado",
              title: "Vehículo Certificado", // Fixed title as requested
              description: `Matrícula: ${entrega.matricula}`,
              created_at: entrega.created_at,
              icon: CheckCircle,
              color: "text-indigo-500",
              badge: certifiedBadge,
              user_name: "Taller", // Hardcoded to "Taller" as requested
            })
          }
        } else {
          debug.push("Fin Certificación: sin datos")
        }
      } catch (err) {
        console.log("⚠️ Tabla entregas (certified) no accesible:", err)
        debug.push("Fin Certificación: no accesible")
      }

      // Ordenar por fecha y tomar los 8 más recientes (aumentado para mostrar más actividades)
      const sortedActivities = activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)

      console.log("📊 Total actividades encontradas:", sortedActivities.length)
      debug.push(`Total: ${sortedActivities.length}`)

      setActivities(sortedActivities)
      setDebugInfo(debug)
    } catch (error) {
      console.error("💥 Error cargando actividad reciente:", error)
      setDebugInfo([`Error general: ${error}`])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={cn("col-span-1 md:col-span-2 lg:col-span-2", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-start pb-4 animate-pulse">
                <div className="mr-4 mt-1">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const actividadesMostradas = activities.slice(0, 4); // Solo los 4 más recientes

  return (
    <Card className={cn("col-span-1 md:col-span-2 lg:col-span-2", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Actividad Reciente
          </div>
          <Button onClick={loadRecentActivity} disabled={loading} size="sm" variant="outline">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {actividadesMostradas.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay actividad reciente disponible</p>
          </div>
        ) : (
          <div className="space-y-3 relative">
            {actividadesMostradas.map((activity, index) => {
              const Icon = activity.icon
              const isVenta = activity.type === "sale"
              // Aplicar opacidad gradual al octavo elemento (70%)
              const opacity = index === 7 ? "opacity-70" : "opacity-100"

              return (
                <div
                  key={activity.id}
                  className={`flex items-start p-3 rounded-lg border border-border/50 transition-all duration-300 hover:bg-accent/30 ${opacity}`}
                >
                  <div className="mr-4 mt-1 relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 border-border shadow-sm">
                      <Icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
                          {activity.badge && (
                            <Badge
                              variant={isVenta ? "default" : "secondary"}
                              className={`text-xs px-2 py-0.5 ${
                                activity.payment_method === "Financiado"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  : activity.payment_method === "Contado"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : ""
                              }`}
                            >
                              {activity.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                        {isVenta && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-mono text-foreground">{activity.price?.toLocaleString()}€</p>
                            <span className="text-xs text-muted-foreground">
                              {activity.payment_method === "Financiado" ? "Financiado" : "Contado"}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Por: {activity.user_name || "Sistema"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2 shrink-0">
                        <Clock className="h-3 w-3" />
                        <span className="whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* Debug info */}
        <div className="mt-4 text-xs text-muted-foreground text-left font-mono">
          <p>Debug: {debugInfo.join(" | ")}</p>
        </div>
      </CardContent>
    </Card>
  )
}
