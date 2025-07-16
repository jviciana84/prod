"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, KeyRound, CreditCard, FileText, Car } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"

// Tipos de incidencia relevantes para llaves y documentos
const RELEVANT_INCIDENCE_TYPES = ["2ª llave", "CardKey", "Ficha técnica", "Permiso circulación"]

interface IncidenceCounts {
  total: number
  segundaLlave: number
  cardKey: number
  fichaTecnica: number
  permisoCirculacion: number
}

export function KeyDocumentIncidencesCard() {
  const [counts, setCounts] = useState<IncidenceCounts>({
    total: 0,
    segundaLlave: 0,
    cardKey: 0,
    fichaTecnica: 0,
    permisoCirculacion: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchIncidenceCounts() {
      setLoading(true)
      try {
        console.log("🔍 Obteniendo incidencias activas desde la tabla entregas...")

        // Obtener todas las entregas que tienen incidencias activas
        const { data: entregasConIncidencias, error } = await supabase
          .from("entregas")
          .select("id, matricula, tipos_incidencia, incidencia")
          .eq("incidencia", true)
          .not("tipos_incidencia", "is", null)

        if (error) {
          console.error("Error al obtener entregas con incidencias:", error)
          throw error
        }

        console.log("📊 Entregas con incidencias encontradas:", entregasConIncidencias?.length || 0)

        // Contar incidencias por tipo desde la tabla entregas (fuente de verdad)
        let segundaLlaveCount = 0
        let cardKeyCount = 0
        let fichaTecnicaCount = 0
        let permisoCirculacionCount = 0

        entregasConIncidencias?.forEach((entrega) => {
          const tiposIncidencia = entrega.tipos_incidencia || []

          // Contar cada tipo de incidencia presente
          tiposIncidencia.forEach((tipo: string) => {
            switch (tipo) {
              case "2ª llave":
                segundaLlaveCount++
                break
              case "CardKey":
                cardKeyCount++
                break
              case "Ficha técnica":
                fichaTecnicaCount++
                break
              case "Permiso circulación":
                permisoCirculacionCount++
                break
            }
          })
        })

        const newCounts: IncidenceCounts = {
          total: Math.max(0, segundaLlaveCount + cardKeyCount + fichaTecnicaCount + permisoCirculacionCount),
          segundaLlave: Math.max(0, segundaLlaveCount),
          cardKey: Math.max(0, cardKeyCount),
          fichaTecnica: Math.max(0, fichaTecnicaCount),
          permisoCirculacion: Math.max(0, permisoCirculacionCount),
        }

        console.log("📈 Conteos finales desde entregas:", newCounts)
        setCounts(newCounts)
      } catch (err) {
        console.error("Error en fetchIncidenceCounts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchIncidenceCounts()

    // Configurar suscripción en tiempo real para actualizaciones en la tabla entregas
    const channel = supabase
      .channel("entregas_incidencias_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "entregas" }, (payload) => {
        console.log("🔄 Cambio detectado en entregas:", payload)
        fetchIncidenceCounts() // Actualizar contadores cuando haya cambios
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const StatItem = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => (
    <div className="flex items-center justify-between p-3 bg-muted/60 hover:bg-muted/90 transition-colors rounded-md">
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-foreground/80">{label}:</span>
      </div>
      <Badge variant={value > 0 ? "destructive" : "secondary"} className="text-sm">
        {loading ? "..." : value}
      </Badge>
    </div>
  )

  return (
    <Link href="/dashboard/llaves/incidencias" className="block hover:opacity-90 transition-opacity">
      <Card className="border-2 border-red-600 shadow-lg hover:shadow-red-600/50 transition-all duration-300 ease-in-out text-white cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <CardTitle>Incidencias Pendientes</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Llaves y documentación pendiente de entrega.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between py-2">
            <span className="text-md font-medium text-foreground">Total incidencias:</span>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {loading ? "..." : counts.total}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatItem label="2ª Llave" value={counts.segundaLlave} icon={KeyRound} />
            <StatItem label="Card Key" value={counts.cardKey} icon={CreditCard} />
            <StatItem label="Ficha Téc." value={counts.fichaTecnica} icon={FileText} />
            <StatItem label="Permiso Circ." value={counts.permisoCirculacion} icon={Car} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
