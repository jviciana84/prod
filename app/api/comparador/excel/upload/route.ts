import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

// Función para convertir fecha serial de Excel a Date
function excelSerialToDate(serial: number): Date | null {
  if (!serial || typeof serial !== 'number') return null
  
  // Excel cuenta desde 1900-01-01 (con bug del año 1900)
  const excelEpoch = new Date(1900, 0, 1)
  const days = serial - 1 // Ajuste por el bug de Excel
  const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000)
  
  return date
}

// Función para normalizar modelo (similar a la del análisis)
function normalizeModeloParaBusqueda(modelo: string, serie?: string): string {
  if (!modelo) return ''
  
  let modeloNormalizado = modelo.trim()
  
  // Remover paréntesis con código (ej: "116d (F40)" -> "116d")
  modeloNormalizado = modeloNormalizado.replace(/\s*\([^)]*\)\s*$/g, '').trim()
  
  // Si tenemos serie, construir modelo completo
  if (serie) {
    const serieLower = serie.toLowerCase()
    
    // BMW Serie X
    if (serieLower.includes('serie')) {
      // "Serie 1" + "116d" -> "Serie 1 116d"
      modeloNormalizado = `${serie} ${modeloNormalizado}`
    }
    // MINI con puertas
    else if (serieLower.includes('doors') || serieLower.includes('puertas')) {
      // "5 DOORS" + "Cooper 5-puertas" -> "MINI 5 Puertas Cooper"
      const numPuertas = serieLower.match(/\d+/)
      if (numPuertas) {
        modeloNormalizado = `MINI ${numPuertas[0]} Puertas ${modeloNormalizado.replace(/\d+-puertas/gi, '').trim()}`
      }
    }
  }
  
  return modeloNormalizado
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Excel Upload] Iniciando carga de archivo...')
    
    // ✅ PATRÓN OFICIAL: createServerClient con cookies
    const supabase = await createServerClient(await cookies())
    
    // ✅ Verificar autenticación según guía
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ [Excel Upload] Usuario no autenticado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    console.log('✅ [Excel Upload] Usuario autenticado:', user.id)
    const userId = user.id
    
    // Leer archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró archivo' },
        { status: 400 }
      )
    }
    
    // Validar que sea un Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'El archivo debe ser un Excel (.xlsx o .xls)' },
        { status: 400 }
      )
    }
    
    // Leer contenido del archivo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Parsear Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // Convertir a JSON (array de objetos)
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)
    
    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'El Excel está vacío o no tiene datos válidos' },
        { status: 400 }
      )
    }
    
    // Procesar cada fila
    const vehiculosParaInsertar = []
    const errores = []
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      
      try {
        // Validar campos obligatorios
        if (!row['MODELO ']) {
          errores.push(`Fila ${i + 2}: Modelo vacío`)
          continue
        }
        
        // Convertir fecha de Excel serial a Date
        let fechaMatriculacion = null
        if (row['FECHA MATRICULACIÓN']) {
          const fecha = excelSerialToDate(row['FECHA MATRICULACIÓN'])
          if (fecha) {
            fechaMatriculacion = fecha.toISOString().split('T')[0] // YYYY-MM-DD
          }
        }
        
        // Normalizar modelo para búsqueda
        const modeloNormalizado = normalizeModeloParaBusqueda(
          row['MODELO '] || '',
          row['SERIE'] || ''
        )
        
        vehiculosParaInsertar.push({
          lote: row['LOTE'] || null,
          chasis: row['CHASIS'] || null,
          matricula: row['MATRÍCULA'] || null,
          compania: row['COMPAÑÍA'] || null,
          origen: row['ORIGEN'] || null,
          marca: row['MARCA'] || null,
          serie: row['SERIE'] || null,
          ecode: row['ECODE'] || null,
          modelo: modeloNormalizado,
          fecha_matriculacion: fechaMatriculacion,
          km: row['KM'] || null,
          daño_neto: row['DAÑO NETO'] || null,
          combustible: row['COMBUSTIBLE'] || null,
          kw: row['KW'] || null,
          cambio: row['CAMBIO'] || null,
          color: row['COLOR'] || null,
          tapiceria: row['TAPICERÍA'] || null,
          equip_porcentaje: row['% EQUIP'] ? (row['% EQUIP'] < 1 ? row['% EQUIP'] * 100 : row['% EQUIP']) : null,
          opciones: row['OPCIONES'] || null,
          resumen_opciones: row['RESUMEN OPCIONES'] || null,
          reg_fis: row['REG FIS.'] || null,
          break_even: row['BREAK EVEN / VR NETO'] || null,
          precio_nuevo_bruto: row['PRECIO NUEVO BRUTO'] || null,
          msrp_prod_date: row['MSRP Prod Date'] || null,
          tipo_usado: row['TIPO DE USADO'] || null,
          precio_salida_bruto: row['PRECIO SALIDA  BRUTO'] || null,
          precio_salida_neto: row['PRECIO SALIDA NETO'] || null,
          nombre_archivo: file.name,
          cargado_por: userId,
          num_competidores: 0 // Inicializar en 0, se actualizará después
        })
      } catch (error: any) {
        errores.push(`Fila ${i + 2}: ${error.message}`)
      }
    }
    
    if (vehiculosParaInsertar.length === 0) {
      return NextResponse.json(
        { 
          error: 'No se pudieron procesar vehículos', 
          errores 
        },
        { status: 400 }
      )
    }
    
    // Insertar en base de datos
    console.log(`🔄 [Excel Upload] Insertando ${vehiculosParaInsertar.length} vehículos...`)
    
    const { data: insertedData, error: insertError } = await supabase
      .from('vehiculos_excel_comparador')
      .insert(vehiculosParaInsertar)
      .select()
    
    if (insertError) {
      console.error('❌ [Excel Upload] Error insertando vehículos:', insertError)
      return NextResponse.json(
        { error: 'Error guardando vehículos en base de datos', details: insertError.message },
        { status: 500 }
      )
    }
    
    console.log(`✅ [Excel Upload] ${insertedData.length} vehículos insertados correctamente`)
    
    // AHORA: Buscar precios en la red para cada vehículo
    const vehiculosConPrecios = []
    
    for (const vehiculo of insertedData) {
      try {
        // Buscar competidores similares en comparador_scraper
        let query = supabase
          .from('comparador_scraper')
          .select('precio, km, año, modelo')
          .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado'])
        
        // Filtrar por modelo (contiene)
        if (vehiculo.modelo) {
          // Buscar modelos similares (flexible)
          query = query.or(`modelo.ilike.%${vehiculo.modelo}%`)
        }
        
        // Filtrar por año (±1 año de tolerancia)
        if (vehiculo.fecha_matriculacion) {
          const fechaVehiculo = new Date(vehiculo.fecha_matriculacion)
          const añoVehiculo = fechaVehiculo.getFullYear()
          query = query.gte('año', (añoVehiculo - 1).toString())
          query = query.lte('año', (añoVehiculo + 1).toString())
        }
        
        const { data: competidores, error: compError } = await query
        
        if (compError) {
          console.error(`Error buscando competidores para ${vehiculo.id}:`, compError)
          continue
        }
        
        // Calcular precio medio de competidores
        if (competidores && competidores.length > 0) {
          const precios = competidores
            .map(c => {
              if (typeof c.precio === 'string') {
                return parseFloat(c.precio.replace(/[€.\s]/g, '').replace(',', '.'))
              }
              return c.precio
            })
            .filter(p => !isNaN(p) && p > 0)
          
          if (precios.length > 0) {
            const precioMedio = precios.reduce((sum, p) => sum + p, 0) / precios.length
            
            // Precio competitivo: 5% menos que el precio medio
            const precioCompetitivo = precioMedio * 0.95
            
            // Actualizar vehículo con precios calculados
            const { error: updateError } = await supabase
              .from('vehiculos_excel_comparador')
              .update({
                precio_medio_red: Math.round(precioMedio),
                precio_competitivo: Math.round(precioCompetitivo),
                num_competidores: precios.length,
                ultima_busqueda_red: new Date().toISOString()
              })
              .eq('id', vehiculo.id)
            
            if (!updateError) {
              vehiculosConPrecios.push({
                ...vehiculo,
                precio_medio_red: Math.round(precioMedio),
                precio_competitivo: Math.round(precioCompetitivo),
                num_competidores: precios.length
              })
            }
          }
        } else {
          vehiculosConPrecios.push({
            ...vehiculo,
            precio_medio_red: null,
            precio_competitivo: null,
            num_competidores: 0
          })
        }
      } catch (error: any) {
        console.error(`Error procesando vehículo ${vehiculo.id}:`, error)
      }
    }
    
    console.log(`✅ [Excel Upload] Proceso completado exitosamente`)
    console.log(`📊 [Excel Upload] Total: ${vehiculosParaInsertar.length} | Con precios: ${vehiculosConPrecios.filter(v => v.precio_medio_red).length}`)
    
    return NextResponse.json({
      success: true,
      message: `${vehiculosParaInsertar.length} vehículos cargados correctamente`,
      vehiculos: vehiculosConPrecios,
      errores: errores.length > 0 ? errores : undefined
    })
    
  } catch (error: any) {
    console.error('❌ [Excel Upload] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error procesando archivo', details: error.message },
      { status: 500 }
    )
  }
}


