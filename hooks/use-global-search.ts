"use client"

import { useState, useCallback } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { getUserAsesorName } from "@/lib/user-mapping"

interface SearchResult {
  id: string
  type: 'vehicle' | 'sale' | 'delivery' | 'stock' | 'photo' | 'key' | 'document'
  license_plate: string
  model?: string
  brand?: string
  status?: string
  data: Record<string, any>
}

export function useGlobalSearch() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const supabase = createClientComponentClient()

  // Función auxiliar para resolver el nombre completo del asesor
  const resolveAsesorName = async (asesorAlias: string | null | undefined): Promise<string> => {
    if (!asesorAlias) return "Sin asignar"
    
    // Si ya es un nombre completo (contiene espacios), devolverlo tal como está
    if (asesorAlias.includes(" ") || ["Comercial", "Sistema", "Taller"].includes(asesorAlias)) {
      return asesorAlias
    }
    
    try {
      // Buscar en la tabla profiles por alias
      const { data: profileByAlias, error: aliasError } = await supabase
        .from("profiles")
        .select("full_name, alias")
        .ilike("alias", asesorAlias)
        .single()

      if (profileByAlias && !aliasError && profileByAlias.full_name) {
        return profileByAlias.full_name
      }

      // Si no se encuentra por alias, buscar por nombre completo (primera palabra del alias)
      const firstWordOfAlias = asesorAlias.split(" ")[0]
      if (firstWordOfAlias) {
        const { data: profileByName, error: nameError } = await supabase
          .from("profiles")
          .select("full_name")
          .ilike("full_name", `${firstWordOfAlias}%`)
          .limit(1)
          .single()

        if (profileByName && !nameError && profileByName.full_name) {
          return profileByName.full_name
        }
      }

      // Mapeo manual para casos conocidos
      const manualMappings: Record<string, string> = {
        JordiVi: "Jordi Viciana",
        "jordi.viciana@munichgroup.es": "Jordi Viciana",
        // Añadir más mapeos según sea necesario
      }

      if (manualMappings[asesorAlias]) {
        return manualMappings[asesorAlias]
      }

      // Como último recurso, devolver el alias original
      return asesorAlias
    } catch (error) {
      console.error("Error resolviendo nombre del asesor:", error)
      return asesorAlias
    }
  }

  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return []

    setIsLoading(true)
    const allResults: SearchResult[] = []

    try {
      // Buscar en sales_vehicles (ventas)
      const { data: salesData, error: salesError } = await supabase
        .from('sales_vehicles')
        .select('*')
        .or(`license_plate.ilike.%${query}%,model.ilike.%${query}%,advisor.ilike.%${query}%,client_name.ilike.%${query}%,client_email.ilike.%${query}%`)
        .limit(10)
      
      if (salesError) {
        console.error('Error en sales_vehicles:', salesError)
      }

      if (salesData) {
        // Resolver nombres de asesores para todos los elementos
        const salesWithResolvedNames = await Promise.all(
          salesData.map(async (item) => {
            const resolvedAdvisor = await resolveAsesorName(item.advisor)
            return {
              ...item,
              advisor_resolved: resolvedAdvisor
            }
          })
        )

        salesWithResolvedNames.forEach(item => {
          allResults.push({
            id: item.id,
            type: 'sale',
            license_plate: item.license_plate,
            model: item.model,
            brand: item.brand,
            status: item.cyp_status === 'completado' && item.photo_360_status === 'completado' ? 'completado' : 'pendiente',
            data: {
              ...item,
              sale_date: item.sale_date,
              price: item.price,
              payment_method: item.payment_method,
              advisor: item.advisor_resolved, // Usar el nombre resuelto
              client_name: item.client_name,
              client_email: item.client_email,
              client_phone: item.client_phone,
              cyp_status: item.cyp_status,
              photo_360_status: item.photo_360_status,
              cyp_date: item.cyp_date,
              photo_360_date: item.photo_360_date,
              discount: item.discount,
              brand: item.brand,
              model: item.model
            }
          })
        })
      }

      // Buscar en entregas
      const { data: entregasData } = await supabase
        .from('entregas')
        .select('*')
        .or(`matricula.ilike.%${query}%,modelo.ilike.%${query}%,asesor.ilike.%${query}%`)
        .limit(10)

      if (entregasData) {
        // Resolver nombres de asesores para todos los elementos
        const entregasWithResolvedNames = await Promise.all(
          entregasData.map(async (item) => {
            const resolvedAsesor = await resolveAsesorName(item.asesor)
            return {
              ...item,
              asesor_resolved: resolvedAsesor
            }
          })
        )

        entregasWithResolvedNames.forEach(item => {
          allResults.push({
            id: item.id,
            type: 'delivery',
            license_plate: item.matricula,
            model: item.modelo,
            status: item.fecha_entrega ? 'entregado' : 'pendiente',
            data: {
              ...item,
              fecha_venta: item.fecha_venta,
              fecha_entrega: item.fecha_entrega,
              asesor: item.asesor_resolved, // Usar el nombre resuelto
              incidencia: item.incidencia,
              tipos_incidencia: item.tipos_incidencia,
              observaciones: item.observaciones
            }
          })
        })
      }

      // Buscar en stock
      const { data: stockData } = await supabase
        .from('stock')
        .select('*')
        .or(`license_plate.ilike.%${query}%,model.ilike.%${query}%`)
        .limit(10)

      if (stockData) {
        stockData.forEach(item => {
          allResults.push({
            id: item.id,
            type: 'stock',
            license_plate: item.license_plate,
            model: item.model,
            status: item.is_sold ? 'vendido' : 'disponible',
            data: {
              ...item,
              reception_date: item.reception_date,
              inspection_date: item.inspection_date,
              paint_status: item.paint_status,
              mechanical_status: item.mechanical_status,
              body_status: item.body_status,
              vehicle_type: item.vehicle_type,
              is_sold: item.is_sold
            }
          })
        })
      }

      // Buscar en fotos
      const { data: fotosData } = await supabase
        .from('fotos')
        .select('*')
        .or(`license_plate.ilike.%${query}%,model.ilike.%${query}%`)
        .limit(10)

      if (fotosData) {
        fotosData.forEach(item => {
          allResults.push({
            id: item.id,
            type: 'photo',
            license_plate: item.license_plate,
            model: item.model,
            status: item.photos_completed ? 'completado' : 'pendiente',
            data: {
              ...item,
              photos_completed: item.photos_completed,
              photos_completed_date: item.photos_completed_date,
              estado_pintura: item.estado_pintura,
              paint_apto_date: item.paint_apto_date,
              assigned_to: item.assigned_to
            }
          })
        })
      }

      // Buscar en nuevas_entradas
      const { data: nuevasEntradasData } = await supabase
        .from('nuevas_entradas')
        .select('*')
        .or(`license_plate.ilike.%${query}%,model.ilike.%${query}%`)
        .limit(10)

      if (nuevasEntradasData) {
        nuevasEntradasData.forEach(item => {
          allResults.push({
            id: item.id,
            type: 'vehicle',
            license_plate: item.license_plate,
            model: item.model,
            status: item.is_received ? 'recibido' : 'pendiente',
            data: {
              ...item,
              purchase_date: item.purchase_date,
              reception_date: item.reception_date,
              purchase_price: item.purchase_price,
              vehicle_type: item.vehicle_type,
              is_received: item.is_received
            }
          })
        })
      }

      // Buscar en duc_scraper
      const { data: ducData } = await supabase
        .from('duc_scraper')
        .select('*')
        .or(`Matrícula.ilike.%${query}%,Modelo.ilike.%${query}%,Marca.ilike.%${query}%`)
        .limit(10)

      if (ducData) {
        ducData.forEach(item => {
          allResults.push({
            id: item.id,
            type: 'vehicle',
            license_plate: item.Matrícula || item.Matricula,
            model: item.Modelo,
            brand: item.Marca,
            status: 'disponible',
            data: {
              ...item,
              precio: item.Precio,
              km: item.KM,
              combustible: item.Combustible,
              color: item['Color Carrocería'],
              año: item['Fecha fabricación'],
              concesionario: item.Concesionario
            }
          })
        })
      }

      // Buscar en incentivos
      const { data: incentivosData } = await supabase
        .from('incentivos')
        .select('*')
        .or(`matricula.ilike.%${query}%,modelo.ilike.%${query}%,asesor.ilike.%${query}%`)
        .limit(10)

      if (incentivosData) {
        // Resolver nombres de asesores para todos los elementos
        const incentivosWithResolvedNames = await Promise.all(
          incentivosData.map(async (item) => {
            const resolvedAsesor = await resolveAsesorName(item.asesor)
            return {
              ...item,
              asesor_resolved: resolvedAsesor
            }
          })
        )

        incentivosWithResolvedNames.forEach(item => {
          allResults.push({
            id: item.id.toString(),
            type: 'sale',
            license_plate: item.matricula,
            model: item.modelo,
            status: item.tramitado ? 'tramitado' : 'pendiente',
            data: {
              ...item,
              fecha_entrega: item.fecha_entrega,
              asesor: item.asesor_resolved, // Usar el nombre resuelto
              forma_pago: item.forma_pago,
              precio_venta: item.precio_venta,
              precio_compra: item.precio_compra,
              dias_stock: item.dias_stock,
              financiado: item.financiado,
              margen: item.margen,
              importe_total: item.importe_total
            }
          })
        })
      }

      // Buscar en extornos
      const { data: extornosData } = await supabase
        .from('extornos')
        .select('*')
        .or(`matricula.ilike.%${query}%,cliente.ilike.%${query}%`)
        .limit(10)

      if (extornosData) {
        extornosData.forEach(item => {
          allResults.push({
            id: item.id.toString(),
            type: 'sale',
            license_plate: item.matricula,
            status: item.estado,
            data: {
              ...item,
              cliente: item.cliente,
              concepto: item.concepto,
              importe: item.importe,
              numero_cuenta: item.numero_cuenta,
              concesion: item.concesion,
              fecha_tramitacion: item.fecha_tramitacion
            }
          })
        })
      }

      // Eliminar duplicados basándose en matrícula y tipo
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.license_plate === result.license_plate && r.type === result.type)
      )

      // Ordenar por relevancia (exact match primero, luego partial match)
      const sortedResults = uniqueResults.sort((a, b) => {
        const aExact = a.license_plate.toLowerCase() === query.toLowerCase()
        const bExact = b.license_plate.toLowerCase() === query.toLowerCase()
        
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        
        return 0
      })

      setResults(sortedResults)
      return sortedResults

    } catch (error) {
      console.error('Error en búsqueda global:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  return {
    search,
    results,
    isLoading
  }
}
