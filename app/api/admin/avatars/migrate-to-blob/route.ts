import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: userRoles } = await supabase.rpc("get_user_role_names", {
      user_id_param: session.user.id,
    })

    const isAdmin = userRoles && (userRoles.includes("admin") || userRoles.includes("Administrador"))

    if (!isAdmin) {
      return NextResponse.json({ message: "No tienes permisos para realizar esta acción" }, { status: 403 })
    }

    // Verificar si la tabla existe
    const { data: tableExists } = await supabase.rpc("check_table_exists", {
      table_name_param: "avatar_mappings",
    })

    if (!tableExists) {
      return NextResponse.json({ message: "La tabla de mapeo no existe" }, { status: 400 })
    }

    // Directorio de avatares
    const avatarsDir = path.join(process.cwd(), "public", "avatars")

    // Verificar si el directorio existe
    try {
      await stat(avatarsDir)
    } catch (error) {
      return NextResponse.json(
        {
          message: "El directorio de avatares no existe",
          stats: { total: 0, processed: 0, success: 0, failed: 0 },
        },
        { status: 400 },
      )
    }

    // Obtener lista de archivos
    const files = await readdir(avatarsDir)
    const imageFiles = files.filter(
      (file) => file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".gif"),
    )

    // Estadísticas
    const stats = {
      total: imageFiles.length,
      processed: 0,
      success: 0,
      failed: 0,
    }

    // Procesar cada archivo
    for (const file of imageFiles) {
      try {
        const filePath = path.join(avatarsDir, file)
        const localPath = `/avatars/${file}`

        // Verificar si ya existe en la base de datos
        const { data: existingMapping } = await supabase
          .from("avatar_mappings")
          .select("blob_url")
          .eq("local_path", localPath)
          .single()

        if (existingMapping?.blob_url) {
          // Ya existe, incrementar contador
          stats.processed++
          stats.success++
          continue
        }

        // Leer el archivo
        const fileBuffer = await readFile(filePath)

        // Subir a Blob
        const blob = await put(`avatars/${file}`, fileBuffer, {
          access: "public",
          contentType: file.endsWith(".png")
            ? "image/png"
            : file.endsWith(".jpg") || file.endsWith(".jpeg")
              ? "image/jpeg"
              : "image/gif",
        })

        // Guardar mapeo en la base de datos
        await supabase.from("avatar_mappings").insert({
          local_path: localPath,
          blob_url: blob.url,
        })

        stats.processed++
        stats.success++
      } catch (error) {
        console.error(`Error al procesar ${file}:`, error)
        stats.processed++
        stats.failed++
      }
    }

    return NextResponse.json({
      message: `Migración completada: ${stats.success} exitosos, ${stats.failed} fallidos`,
      stats,
    })
  } catch (error: any) {
    console.error("Error al migrar avatares:", error)
    return NextResponse.json(
      {
        message: error.message || "Error al migrar avatares",
        stats: { total: 0, processed: 0, success: 0, failed: 0 },
      },
      { status: 500 },
    )
  }
}
