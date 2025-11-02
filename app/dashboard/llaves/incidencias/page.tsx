"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { KeyDocumentIncidencesTable } from "@/components/keys/key-document-incidences-table"
import type { IncidenciaHistorialConDetalles } from "@/types/incidencias"

import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Key } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

// Tipos de incidencia específicos para esta página
const RELEVANT_INCIDENCE_TYPES = ["2ª llave", "CardKey", "Ficha técnica", "Permiso circulación"]

export default function KeyDocumentIncidencesPage() {
  const [incidences, setIncidences] = useState<IncidenciaHistorialConDetalles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchIncidences() {
      setLoading(true)
      setError(null)
      try {
        // 1. Obtener incidencias
        const { data: incidencesData, error: incidencesError } = await supabase
          .from("incidencias_historial")
          .select(`
            id,
            entrega_id,
            tipo_incidencia,
            comentario, 
            resuelta,
            fecha_resolucion,
            fecha, 
            usuario_id,
            matricula,
            matricula_manual
          `)
          .in("tipo_incidencia", RELEVANT_INCIDENCE_TYPES)
          .order("fecha", { ascending: false })

        if (incidencesError) {
          console.error("Error fetching incidences_historial:", incidencesError)
          setError(`Error al cargar historial de incidencias: ${incidencesError.message}`)
          throw incidencesError
        }

        if (!incidencesData || incidencesData.length === 0) {
          setIncidences([])
          setLoading(false)
          return
        }

        // 2. Obtener los IDs de entrega únicos y no nulos
        const entregaIds = [
          ...new Set(
            incidencesData.map((inc) => inc.entrega_id).filter((id) => id !== null && id !== undefined) as string[],
          ),
        ]

        const entregasMap = new Map()

        if (entregaIds.length > 0) {
          // 3. Obtener detalles de las entregas (simplificado)
          const { data: entregasData, error: entregasError } = await supabase
            .from("entregas")
            .select(`
              id,
              matricula,
              fecha_entrega
            `) // Eliminada la referencia a usuarios
            .in("id", entregaIds)

          if (entregasError) {
            console.error("Error fetching entregas:", entregasError)
            setError(
              `Error al cargar detalles de entrega: ${entregasError.message}. Mostrando incidencias sin detalles completos.`,
            )
          }

          if (entregasData) {
            entregasData.forEach((entrega: any) => {
              entregasMap.set(entrega.id, entrega)
            })
          }
        }

        // 4. Combinar datos
        const formattedData = incidencesData.map((item: any) => {
          const entregaDetalles = item.entrega_id ? entregasMap.get(item.entrega_id) : null
          return {
            id: item.id,
            id_entrega: item.entrega_id,
            tipo_incidencia: item.tipo_incidencia,
            descripcion: item.comentario,
            resuelta: item.resuelta,
            fecha_resolucion: item.fecha_resolucion,
            created_at: item.fecha,
            usuario_registro: item.usuario_id,
            matricula: entregaDetalles?.matricula || item.matricula_manual || item.matricula || "N/A",
            fecha_entrega: entregaDetalles?.fecha_entrega,
            nombre_asesor: "N/A", // Ya no intentamos obtener el nombre del asesor
          } as IncidenciaHistorialConDetalles
        })

        setIncidences(formattedData)
      } catch (err) {
        if (!error && err instanceof Error) {
          setError(err.message)
        }
        console.error("Error en fetchIncidences:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchIncidences()

    const channel = supabase
      .channel("incidencias_historial_llaves_docs_page_v4")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidencias_historial" }, (payload) => {
        console.log("Change received in incidencias_historial on llaves/incidencias page!", payload)
        fetchIncidences()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="p-4 md:p-5 space-y-4 pb-20">
        <div className="space-y-2">
          <Breadcrumbs className="mt-4" segments={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Llaves", href: "/dashboard/llaves" },
            { title: "Incidencias", href: "/dashboard/llaves/incidencias" },
          ]} />
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Incidencias de Llaves y Documentación</h1>
              <p className="text-muted-foreground">Historial y gestión de incidencias relacionadas con llaves y documentación</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center min-h-[200px]">
          <BMWMSpinner size={32} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-5 space-y-4 pb-20">
        <div className="space-y-2">
          <Breadcrumbs className="mt-4" segments={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Llaves", href: "/dashboard/llaves" },
            { title: "Incidencias", href: "/dashboard/llaves/incidencias" },
          ]} />
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Incidencias de Llaves y Documentación</h1>
              <p className="text-muted-foreground">Historial y gestión de incidencias relacionadas con llaves y documentación</p>
            </div>
          </div>
        </div>
        <p className="text-red-500 text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" segments={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Llaves", href: "/dashboard/llaves" },
          { title: "Incidencias", href: "/dashboard/llaves/incidencias" },
        ]} />
        <div className="flex items-center gap-3">
          <Key className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incidencias de Llaves y Documentación</h1>
            <p className="text-muted-foreground">Historial y gestión de incidencias relacionadas con llaves y documentación</p>
          </div>
        </div>
      </div>
      <KeyDocumentIncidencesTable incidences={incidences} />
    </div>
  )
}
