"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { KeyDocumentIncidencesTable } from "@/components/keys/key-document-incidences-table"
import type { IncidenciaHistorialConDetalles } from "@/types/incidencias"
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
      <div className="flex justify-center items-center h-screen">
        <BMWMSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Incidencias de Llaves y Documentación</h1>
        <p className="text-red-500 text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Incidencias de Llaves y Documentación</h1>
      <KeyDocumentIncidencesTable incidences={incidences} />
    </div>
  )
}
