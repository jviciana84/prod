import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import crypto from "crypto"

interface DocumentMetadata {
  id: string
  nombre: string
  tipo: string
  tamaño: number
  url: string
  subido_en: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB límite estricto
const MAX_FILES_PER_EXTORNO = 10

// Tipos de archivo permitidos (más restrictivo para seguridad)
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]

export async function POST(request: NextRequest) {
  try {
    console.log("📎 === INICIO SUBIDA DOCUMENTO EXTORNO ===")

    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("❌ Error de autenticación:", authError?.message || "Usuario no encontrado")
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no autenticado",
        },
        { status: 401 },
      )
    }
    console.log(`✅ Usuario autenticado: ${user.id}`)

    const formData = await request.formData()
    const file = formData.get("file") as File
    const extornoId = formData.get("extornoId") as string // Can be "new" or actual ID
    const tipo = (formData.get("tipo") as string) || "adjunto"

    if (!file || !extornoId || !tipo) {
      console.error("❌ Faltan parámetros requeridos: file, extornoId o tipo")
      return NextResponse.json(
        {
          success: false,
          error: "Faltan parámetros requeridos: file, extornoId y tipo son obligatorios",
        },
        { status: 400 },
      )
    }

    console.log(`📎 Procesando archivo: ${file.name}`)
    console.log(`📎 Tamaño: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    console.log(`📎 Tipo: ${file.type}`)
    console.log(`📎 Extorno ID: ${extornoId}, Tipo: ${tipo}`)

    // 🚫 VALIDACIÓN ESTRICTA DE TAMAÑO
    if (file.size > MAX_FILE_SIZE) {
      const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1)
      const actualMB = (file.size / 1024 / 1024).toFixed(2)
      console.log(`❌ Archivo rechazado por tamaño: ${actualMB}MB > ${maxMB}MB`)
      return NextResponse.json(
        {
          success: false,
          error: `Archivo demasiado grande: ${actualMB}MB. Máximo permitido: ${maxMB}MB`,
        },
        { status: 400 },
      )
    }

    // 🚫 VALIDACIÓN DE TIPO DE ARCHIVO
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log(`❌ Tipo de archivo no permitido: ${file.type}`)
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single()
    if (profileError) {
      console.warn("⚠️ No se pudo obtener el perfil del usuario:", profileError.message)
    }
    const uploaderEmail = profile?.email || user.email
    const uploaderName = profile?.full_name || user.email
    console.log(`👤 Subido por: ${uploaderName} (${uploaderEmail})`)

    // Generar nombre único para el archivo
    const fileExtension = file.name.split(".").pop() || "bin"
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const uniqueFileName = `extorno-${extornoId}-${timestamp}-${randomId}.${fileExtension}`
    const blobPath = `extornos/${extornoId}/${tipo}/${uniqueFileName}`

    console.log(`📎 Subiendo a Vercel Blob: ${blobPath}`)

    // Subir a Vercel Blob
    const blob = await put(blobPath, file, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log(`✅ Archivo subido a blob: ${blob.url}`)

    // Crear objeto documento
    const documento: DocumentMetadata = {
      id: crypto.randomUUID(),
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size,
      url: blob.url,
      subido_en: new Date().toISOString(),
    }
    console.log("📄 Objeto documento creado:", documento)

    // If it's an existing extorno, update the database record
    if (extornoId !== "new") {
      const extornoNumId = Number.parseInt(extornoId)

      // Verificar que el extorno existe
      const { data: extorno, error: extornoError } = await supabase
        .from("extornos")
        .select("id, documentos_adjuntos, documentos_tramitacion")
        .eq("id", extornoNumId)
        .single()

      if (extornoError || !extorno) {
        console.error(
          "❌ Error obteniendo extorno para actualización:",
          extornoError?.message || "Extorno no encontrado",
        )
        return NextResponse.json(
          {
            success: false,
            error: "Extorno no encontrado o error al consultarlo para actualizar documentos",
            details: extornoError?.message,
          },
          { status: 404 },
        )
      }
      console.log(`✅ Extorno encontrado para actualización: ${extorno.id}`)

      // Verificar límite de archivos
      const documentosActuales = [...(extorno.documentos_adjuntos || []), ...(extorno.documentos_tramitacion || [])]
      if (documentosActuales.length >= MAX_FILES_PER_EXTORNO) {
        console.log(`❌ Límite de archivos alcanzado (${documentosActuales.length}/${MAX_FILES_PER_EXTORNO})`)
        return NextResponse.json(
          {
            success: false,
            error: `Límite de ${MAX_FILES_PER_EXTORNO} archivos alcanzado. Archivos actuales: ${documentosActuales.length}`,
          },
          { status: 400 },
        )
      }
      console.log(`✅ Límite de archivos no alcanzado. Archivos actuales: ${documentosActuales.length}`)

      const campoDocumentos = tipo === "adjunto" ? "documentos_adjuntos" : "documentos_tramitacion"
      const documentosExistentes = extorno[campoDocumentos] || []
      const documentosActualizados = [...documentosExistentes, documento]

      console.log(`🔄 Actualizando extorno ${extornoNumId} en el campo ${campoDocumentos}`)
      const { error: updateError } = await supabase
        .from("extornos")
        .update({
          [campoDocumentos]: documentosActualizados,
          updated_at: new Date().toISOString(),
        })
        .eq("id", extornoNumId)

      if (updateError) {
        console.error("❌ Error actualizando extorno en Supabase:", updateError.message)
        return NextResponse.json(
          {
            success: false,
            error: "Error guardando referencia del documento en la base de datos",
            details: updateError.message,
          },
          { status: 500 },
        )
      }
      console.log(`✅ Documento guardado en extorno ${extornoNumId} en Supabase`)
    }

    console.log("✅ === FIN SUBIDA DOCUMENTO EXTORNO EXITOSA ===")
    return NextResponse.json({ success: true, document: documento })
  } catch (error: any) {
    console.error("❌ Error crítico subiendo documento:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ === INICIO DELETE DOCUMENTO EXTORNO ===")

    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("❌ Error de autenticación:", authError?.message || "Usuario no encontrado")
      return NextResponse.json(
        {
          success: false,
          error: "Usuario no autenticado",
        },
        { status: 401 },
      )
    }
    console.log(`✅ Usuario autenticado: ${user.id}`)

    const { searchParams } = new URL(request.url)
    const documentoId = searchParams.get("documento_id")
    const extornoId = searchParams.get("extorno_id")

    if (!documentoId || !extornoId) {
      console.error("❌ Faltan parámetros requeridos: documento_id o extorno_id")
      return NextResponse.json(
        {
          success: false,
          error: "Faltan parámetros requeridos: documento_id y extorno_id",
        },
        { status: 400 },
      )
    }

    console.log(`🗑️ Eliminando documento ${documentoId} del extorno ${extornoId}`)

    // Obtener extorno actual
    const { data: extorno, error: extornoError } = await supabase
      .from("extornos")
      .select("id, created_by, documentos_adjuntos, documentos_tramitacion")
      .eq("id", extornoId)
      .single()

    if (extornoError || !extorno) {
      console.error("❌ Error obteniendo extorno:", extornoError?.message || "Extorno no encontrado")
      return NextResponse.json(
        {
          success: false,
          error: "Extorno no encontrado o error al consultarlo",
        },
        { status: 404 },
      )
    }
    console.log(`✅ Extorno encontrado: ${extorno.id}`)

    // Buscar documento en ambas listas
    let documentoEncontrado = null
    const nuevosAdjuntos = [...(extorno.documentos_adjuntos || [])]
    const nuevosTramitacion = [...(extorno.documentos_tramitacion || [])]

    // Buscar en adjuntos
    const indexAdjunto = nuevosAdjuntos.findIndex((doc: DocumentMetadata) => doc.id === documentoId)
    if (indexAdjunto !== -1) {
      documentoEncontrado = nuevosAdjuntos[indexAdjunto]
      nuevosAdjuntos.splice(indexAdjunto, 1)
      console.log(`🗑️ Documento encontrado en 'documentos_adjuntos'`)
    } else {
      // Buscar en tramitación
      const indexTramitacion = nuevosTramitacion.findIndex((doc: DocumentMetadata) => doc.id === documentoId)
      if (indexTramitacion !== -1) {
        documentoEncontrado = nuevosTramitacion[indexTramitacion]
        nuevosTramitacion.splice(indexTramitacion, 1)
        console.log(`🗑️ Documento encontrado en 'documentos_tramitacion'`)
      }
    }

    if (!documentoEncontrado) {
      console.error("❌ Documento no encontrado en las listas del extorno")
      return NextResponse.json(
        {
          success: false,
          error: "Documento no encontrado",
        },
        { status: 404 },
      )
    }

    console.log(`🗑️ Documento a eliminar: ${documentoEncontrado.nombre} (URL: ${documentoEncontrado.url})`)

    // Opcional: Eliminar el archivo de Vercel Blob.
    // Esto es importante para evitar archivos huérfanos y gestionar el almacenamiento.
    // La URL del blob contiene la ruta completa.
    // const blobUrlToDelete = documentoEncontrado.url;
    // try {
    //   await del(blobUrlToDelete);
    //   console.log(`✅ Archivo eliminado de Vercel Blob: ${blobUrlToDelete}`);
    // } catch (blobDeleteError: any) {
    //   console.warn(`⚠️ Error al eliminar el archivo de Vercel Blob (${blobUrlToDelete}): ${blobDeleteError.message}`);
    //   // No se devuelve error 500 si falla la eliminación del blob, ya que el registro de la DB es más crítico.
    // }

    // Actualizar extorno sin el documento
    console.log(`🔄 Actualizando extorno ${extornoId} en Supabase para eliminar el documento`)
    const { error: updateError } = await supabase
      .from("extornos")
      .update({
        documentos_adjuntos: nuevosAdjuntos,
        documentos_tramitacion: nuevosTramitacion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", extornoId)

    if (updateError) {
      console.error("❌ Error actualizando extorno en Supabase:", updateError.message)
      return NextResponse.json(
        {
          success: false,
          error: "Error eliminando documento de base de datos",
        },
        { status: 500 },
      )
    }

    console.log(`✅ Documento eliminado del extorno ${extornoId} en Supabase`)
    console.log("✅ === FIN DELETE DOCUMENTO EXTORNO EXITOSA ===")

    return NextResponse.json({
      success: true,
      message: "Documento eliminado exitosamente",
      documento_eliminado: documentoEncontrado,
    })
  } catch (error: any) {
    console.error("❌ Error crítico en delete:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
