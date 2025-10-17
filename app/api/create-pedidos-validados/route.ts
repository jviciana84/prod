import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)

    // SQL para crear la tabla
    const createTableSQL = `
      -- Crear la tabla pedidos_validados
      CREATE TABLE IF NOT EXISTS public.pedidos_validados (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicle_id UUID,
        license_plate VARCHAR(20) NOT NULL,
        model VARCHAR(100) NOT NULL,
        vehicle_type VARCHAR(50) DEFAULT 'Coche',
        document_type VARCHAR(10) DEFAULT 'DNI',
        document_number VARCHAR(20),
        client_name VARCHAR(100),
        price DECIMAL(10, 2) DEFAULT 0,
        payment_method VARCHAR(50) DEFAULT 'Contado',
        status VARCHAR(50) NOT NULL DEFAULT 'Validado',
        validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        advisor_id UUID,
        advisor_name VARCHAR(100),
        observations TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Crear índices
      CREATE INDEX IF NOT EXISTS idx_pedidos_validados_vehicle_id ON pedidos_validados(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_pedidos_validados_license_plate ON pedidos_validados(license_plate);

      -- Habilitar RLS
      ALTER TABLE pedidos_validados ENABLE ROW LEVEL SECURITY;

      -- Crear política (eliminar si existe primero)
      DROP POLICY IF EXISTS "pedidos_validados_policy" ON pedidos_validados;
      CREATE POLICY "pedidos_validados_policy" ON pedidos_validados FOR ALL USING (true);
    `

    // Intentar ejecutar el SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (error) {
      console.error("Error creando tabla:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        suggestion: "Intenta crear la tabla manualmente en el editor SQL de Supabase",
      })
    }

    // Verificar que la tabla se creó
    const { data: testData, error: testError } = await supabase.from("pedidos_validados").select("count(*)").limit(1)

    if (testError) {
      return NextResponse.json({
        success: false,
        error: `Tabla creada pero no accesible: ${testError.message}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Tabla pedidos_validados creada exitosamente",
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
