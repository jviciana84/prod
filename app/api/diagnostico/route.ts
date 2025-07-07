import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function GET() {
  const diagnostico: Record<string, any> = {
    timestamp: new Date().toISOString(),
    entorno: process.env.NODE_ENV,
    problemas: [],
    sugerencias: [],
  }

  // Verificar variables de entorno críticas
  const variablesRequeridas = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "BLOB_READ_WRITE_TOKEN"]

  for (const variable of variablesRequeridas) {
    if (!process.env[variable]) {
      diagnostico.problemas.push(`Variable de entorno ${variable} no encontrada`)
    }
  }

  // Probar conexión a Supabase
  try {
    const supabase = createClient()
    // Cambiamos la consulta para evitar el error de sintaxis
    const { data, error } = await supabase.from("expense_types").select("id").limit(1)

    if (error) {
      diagnostico.problemas.push(`Error al conectar con Supabase: ${error.message}`)
    } else {
      diagnostico.supabase = "Conexión exitosa"
    }
  } catch (error: any) {
    diagnostico.problemas.push(`Excepción al conectar con Supabase: ${error.message}`)
  }

  // Probar Blob Storage
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Añadimos timestamp para crear un nombre único cada vez
      const testFileName = `test-diagnostico-${Date.now()}.txt`
      const testBlob = await put(testFileName, "Test de diagnóstico", {
        access: "public",
        // Alternativamente podríamos usar allowOverwrite: true
      })
      diagnostico.blob = {
        url: testBlob.url,
        status: "Conexión exitosa",
      }
    } else {
      diagnostico.problemas.push("No se puede probar Blob sin BLOB_READ_WRITE_TOKEN")
    }
  } catch (error: any) {
    diagnostico.problemas.push(`Error al probar Blob Storage: ${error.message}`)
  }

  // Añadir sugerencias basadas en problemas encontrados
  if (diagnostico.problemas.length > 0) {
    diagnostico.sugerencias.push(
      "Verifica que todas las variables de entorno estén configuradas en Vercel",
      "Asegúrate de que las credenciales de Supabase sean correctas",
      "Comprueba que el token de Blob tenga permisos de lectura/escritura",
    )
  }

  return NextResponse.json(diagnostico)
}
