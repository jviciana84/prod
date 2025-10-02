import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { query, userId, filters } = await request.json()

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query y userId son requeridos' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Función para construir consultas dinámicas basadas en la query del usuario
    const buildQuery = (userQuery: string, filters: any = {}) => {
      const queryLower = userQuery.toLowerCase()
      
      // Detectar tipo de consulta y construir SQL apropiado
      if (queryLower.includes('vehículo') || queryLower.includes('coche') || queryLower.includes('matrícula')) {
        return buildVehicleQuery(filters)
      } else if (queryLower.includes('venta') || queryLower.includes('vendido')) {
        return buildSalesQuery(filters)
      } else if (queryLower.includes('pedido') || queryLower.includes('validar')) {
        return buildOrderQuery(filters)
      } else if (queryLower.includes('entrega')) {
        return buildDeliveryQuery(filters)
      } else if (queryLower.includes('asesor') || queryLower.includes('usuario')) {
        return buildUserQuery(filters)
      }
      
      return null
    }

    // Construir consulta basada en la query del usuario
    const sqlQuery = buildQuery(query, filters)
    
    if (!sqlQuery) {
      return NextResponse.json({
        error: 'No se pudo interpretar la consulta',
        suggestion: 'Intenta ser más específico sobre qué datos necesitas'
      })
    }

    // Ejecutar consulta
    const { data, error } = await supabase
      .rpc('execute_dynamic_query', {
        query_text: sqlQuery,
        user_id: userId
      })

    if (error) {
      console.error('Error ejecutando consulta:', error)
      return NextResponse.json({
        error: 'Error ejecutando consulta',
        details: error.message
      })
    }

    return NextResponse.json({ 
      data,
      query: sqlQuery,
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Error en API de consultas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Funciones para construir consultas específicas
function buildVehicleQuery(filters: any) {
  let query = `
    SELECT 
      s.license_plate,
      s.model,
      s.vehicle_type,
      s.reception_date,
      s.inspection_date,
      s.paint_status,
      s.mechanical_status,
      s.body_status,
      s.work_center,
      s.created_at
    FROM stock s
    WHERE 1=1
  `
  
  if (filters.license_plate) {
    query += ` AND s.license_plate ILIKE '%${filters.license_plate}%'`
  }
  if (filters.model) {
    query += ` AND s.model ILIKE '%${filters.model}%'`
  }
  if (filters.color) {
    query += ` AND s.color ILIKE '%${filters.color}%'`
  }
  if (filters.status) {
    query += ` AND s.paint_status = '${filters.status}'`
  }
  
  query += ` ORDER BY s.created_at DESC LIMIT 50`
  
  return query
}

function buildSalesQuery(filters: any) {
  let query = `
    SELECT 
      sv.license_plate,
      sv.model,
      sv.brand,
      sv.color,
      sv.sale_date,
      sv.advisor,
      sv.client_name,
      sv.client_phone,
      sv.client_email,
      sv.client_city,
      sv.price,
      sv.payment_method
    FROM sales_vehicles sv
    WHERE 1=1
  `
  
  if (filters.model) {
    query += ` AND sv.model ILIKE '%${filters.model}%'`
  }
  if (filters.color) {
    query += ` AND sv.color ILIKE '%${filters.color}%'`
  }
  if (filters.city) {
    query += ` AND sv.client_city ILIKE '%${filters.city}%'`
  }
  if (filters.advisor) {
    query += ` AND sv.advisor ILIKE '%${filters.advisor}%'`
  }
  
  query += ` ORDER BY sv.sale_date DESC LIMIT 50`
  
  return query
}

function buildOrderQuery(filters: any) {
  let query = `
    SELECT 
      pv.license_plate,
      pv.model,
      pv.advisor,
      pv.client_name,
      pv.client_phone,
      pv.client_email,
      pv.status,
      pv.validation_date,
      pv.created_at
    FROM pedidos_validados pv
    WHERE 1=1
  `
  
  if (filters.license_plate) {
    query += ` AND pv.license_plate ILIKE '%${filters.license_plate}%'`
  }
  if (filters.status) {
    query += ` AND pv.status = '${filters.status}'`
  }
  if (filters.advisor) {
    query += ` AND pv.advisor ILIKE '%${filters.advisor}%'`
  }
  
  query += ` ORDER BY pv.created_at DESC LIMIT 50`
  
  return query
}

function buildDeliveryQuery(filters: any) {
  let query = `
    SELECT 
      e.id,
      e.matricula,
      e.modelo,
      e.asesor,
      e.fecha_venta,
      e.fecha_entrega,
      e.incidencia,
      e.observaciones,
      e.created_at
    FROM entregas e
    WHERE 1=1
  `
  
  if (filters.license_plate) {
    query += ` AND e.matricula ILIKE '%${filters.license_plate}%'`
  }
  if (filters.advisor) {
    query += ` AND e.asesor ILIKE '%${filters.advisor}%'`
  }
  if (filters.date_from) {
    query += ` AND e.fecha_entrega >= '${filters.date_from}'`
  }
  if (filters.date_to) {
    query += ` AND e.fecha_entrega <= '${filters.date_to}'`
  }
  
  query += ` ORDER BY e.fecha_entrega DESC LIMIT 50`
  
  return query
}

function buildUserQuery(filters: any) {
  let query = `
    SELECT 
      p.id,
      p.email,
      p.full_name,
      p.alias,
      p.position,
      p.role,
      p.created_at
    FROM profiles p
    WHERE 1=1
  `
  
  if (filters.name) {
    query += ` AND p.full_name ILIKE '%${filters.name}%'`
  }
  if (filters.role) {
    query += ` AND p.role = '${filters.role}'`
  }
  if (filters.position) {
    query += ` AND p.position ILIKE '%${filters.position}%'`
  }
  
  query += ` ORDER BY p.full_name LIMIT 50`
  
  return query
}

