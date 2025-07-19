'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export interface ProcessingResult {
  success: boolean
  totalFound: number
  processed: number
  added: number
  skipped: number
  errors: number
  errorMessage?: string
}

export async function processFilterConfig(configId: string): Promise<ProcessingResult> {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  try {
    // 1. Obtener la configuración
    const { data: config, error: configError } = await supabase
      .from('filter_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (configError || !config) {
      return {
        success: false,
        totalFound: 0,
        processed: 0,
        added: 0,
        skipped: 0,
        errors: 1,
        errorMessage: 'Configuración no encontrada'
      }
    }

    // 2. Obtener mapeos de columnas activos
    const { data: columnMappings, error: mappingsError } = await supabase
      .from('column_mappings')
      .select('*')
      .eq('is_active', true)

    if (mappingsError) {
      console.error('Error loading column mappings:', mappingsError)
    }

    // 3. Crear registro de procesamiento
    const { data: logEntry, error: logError } = await supabase
      .from('filter_processing_log')
      .insert({
        filter_config_id: configId,
        status: 'processing',
        config_snapshot: config
      })
      .select()
      .single()

    if (logError) {
      return {
        success: false,
        totalFound: 0,
        processed: 0,
        added: 0,
        skipped: 0,
        errors: 1,
        errorMessage: 'Error al crear registro de procesamiento'
      }
    }

    // 4. Construir query con filtros
    let query = supabase
      .from('duc_scraper')
      .select('*')

    // Aplicar filtros de disponibilidad
    if (config.disponibilidad_filter && config.disponibilidad_filter.length > 0) {
      query = query.in('Disponibilidad', config.disponibilidad_filter)
    }

    // Aplicar filtros de marca
    if (config.marca_filter && config.marca_filter.length > 0) {
      query = query.in('Marca', config.marca_filter)
    }

    // Aplicar filtros de precio
    if (config.precio_min) {
      query = query.gte('Precio', config.precio_min.toString())
    }
    if (config.precio_max) {
      query = query.lte('Precio', config.precio_max.toString())
    }

    // Aplicar filtros de kilometraje
    if (config.km_min) {
      query = query.gte('KM', config.km_min.toString())
    }
    if (config.km_max) {
      query = query.lte('KM', config.km_max.toString())
    }

    // Aplicar filtro de libre de siniestros
    if (config.libre_siniestros) {
      query = query.eq('Libre de siniestros', 'Sí')
    }

    // Aplicar filtros de concesionario
    if (config.concesionario_filter && config.concesionario_filter.length > 0) {
      query = query.in('Concesionario', config.concesionario_filter)
    }

    // Aplicar filtros de combustible
    if (config.combustible_filter && config.combustible_filter.length > 0) {
      query = query.in('Combustible', config.combustible_filter)
    }

    // Aplicar filtros de año
    if (config.año_min) {
      query = query.gte('Fecha fabricación', config.año_min.toString())
    }
    if (config.año_max) {
      query = query.lte('Fecha fabricación', config.año_max.toString())
    }

    // Aplicar filtros de días en stock
    if (config.dias_stock_min) {
      query = query.gte('Días stock', config.dias_stock_min.toString())
    }
    if (config.dias_stock_max) {
      query = query.lte('Días stock', config.dias_stock_max.toString())
    }

    // Limitar resultados
    query = query.limit(config.max_vehicles_per_batch || 100)

    // 5. Ejecutar query
    const { data: vehicles, error: queryError } = await query

    if (queryError) {
      // Actualizar log con error
      await supabase
        .from('filter_processing_log')
        .update({
          status: 'failed',
          error_message: queryError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id)

      return {
        success: false,
        totalFound: 0,
        processed: 0,
        added: 0,
        skipped: 0,
        errors: 1,
        errorMessage: queryError.message
      }
    }

    const totalFound = vehicles?.length || 0
    let processed = 0
    let added = 0
    let skipped = 0
    let errors = 0

    // 6. Procesar cada vehículo usando mapeos de columnas
    for (const vehicle of vehicles || []) {
      try {
        processed++

        // Verificar si ya existe en nuevas_entradas (por matrícula)
        const { data: existing } = await supabase
          .from('nuevas_entradas')
          .select('id')
          .eq('license_plate', vehicle.Matrícula)
          .single()

        if (existing) {
          skipped++
          continue
        }

        // Crear objeto base con solo los campos básicos
        const newEntry: any = {
          vehicle_type: 'Coche',
          is_received: false,
          status: 'pendiente',
          entry_date: new Date().toISOString()
        }

        // Aplicar mapeos de columnas básicos
        if (columnMappings) {
          for (const mapping of columnMappings) {
            const sourceValue = vehicle[mapping.duc_scraper_column as keyof typeof vehicle]
            
            if (sourceValue !== undefined && sourceValue !== null) {
              // Para la fecha de compra, convertir formato
              if (mapping.duc_scraper_column === 'Fecha compra DMS') {
                try {
                  const dateStr = sourceValue
                  if (dateStr.includes('/')) {
                    const [day, month, year] = dateStr.split('/')
                    newEntry[mapping.nuevas_entradas_column] = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString()
                  } else {
                    newEntry[mapping.nuevas_entradas_column] = new Date(dateStr).toISOString()
                  }
                } catch (e) {
                  // Si falla la conversión, dejar null
                  newEntry[mapping.nuevas_entradas_column] = null
                }
              } else {
                newEntry[mapping.nuevas_entradas_column] = sourceValue
              }
            }
          }
        }

        // Asegurar campos obligatorios
        if (!newEntry.license_plate && vehicle.Matrícula) {
          newEntry.license_plate = vehicle.Matrícula
        }
        if (!newEntry.model && vehicle.Modelo) {
          newEntry.model = vehicle.Modelo
        }

        // Añadir información básica en las notas
        newEntry.notes = `Capturado automáticamente desde duc_scraper - Config: ${config.name}
        
Información básica:
- Matrícula: ${vehicle.Matrícula || 'N/A'}
- Modelo: ${vehicle.Modelo || 'N/A'}
- Fecha compra: ${vehicle['Fecha compra DMS'] || 'N/A'}
- Marca: ${vehicle.Marca || 'N/A'}
- Precio: ${vehicle.Precio || 'N/A'} €
- Concesionario: ${vehicle.Concesionario || 'N/A'}

El resto de información se completa manualmente en nuevas_entradas.`

        // Insertar en nuevas_entradas
        const { error: insertError } = await supabase
          .from('nuevas_entradas')
          .insert(newEntry)

        if (insertError) {
          errors++
          console.error('Error inserting vehicle:', insertError)
        } else {
          added++
        }
      } catch (error) {
        errors++
        console.error('Error processing vehicle:', error)
      }
    }

    // 7. Actualizar log con resultados
    await supabase
      .from('filter_processing_log')
      .update({
        status: 'completed',
        total_vehicles_found: totalFound,
        vehicles_processed: processed,
        vehicles_added_to_nuevas_entradas: added,
        vehicles_skipped: skipped,
        errors_count: errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', logEntry.id)

    // 8. Actualizar last_used_at en la configuración
    await supabase
      .from('filter_configs')
      .update({
        last_used_at: new Date().toISOString()
      })
      .eq('id', configId)

    return {
      success: true,
      totalFound,
      processed,
      added,
      skipped,
      errors
    }

  } catch (error) {
    console.error('Error in processFilterConfig:', error)
    return {
      success: false,
      totalFound: 0,
      processed: 0,
      added: 0,
      skipped: 0,
      errors: 1,
      errorMessage: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

export async function getProcessingHistory(configId?: string) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  try {
    let query = supabase
      .from('filter_processing_log')
      .select(`
        *,
        filter_configs (
          name,
          description
        )
      `)
      .order('started_at', { ascending: false })

    if (configId) {
      query = query.eq('filter_config_id', configId)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error getting processing history:', error)
    return []
  }
}

export async function deleteFilterConfig(configId: string) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  try {
    const { error } = await supabase
      .from('filter_configs')
      .delete()
      .eq('id', configId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting filter config:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
} 