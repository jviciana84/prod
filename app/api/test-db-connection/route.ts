import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Hacer una consulta simple para probar la conexión
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Error de conexión a la base de datos:', error)
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { status: 'connected', message: 'Conexión exitosa' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error inesperado en test-db-connection:', error)
    return NextResponse.json(
      { status: 'error', message: 'Error de conexión' },
      { status: 500 }
    )
  }
} 