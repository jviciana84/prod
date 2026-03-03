import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { promises as fs } from "fs"
import JSZip from "jszip"
import { getUserRoles } from "@/lib/auth/permissions"

type BundleConfig = {
  zipName: string
  files: {
    source: string
    zipPath: string
    required?: boolean
  }[]
}

const BUNDLES: Record<string, BundleConfig> = {
  "cvo-scraper-v1.2.5-bundle": {
    zipName: "CVO_Scraper_v1.2.5_bundle.zip",
    files: [
      {
        // Ejecutable principal
        source: "cvo-scraper-v1/dist/CVO_Scraper_v1.2.5.exe",
        zipPath: "CVO_Scraper_v1.2.5.exe",
        required: true,
      },
      {
        // Icono principal del scraper (generado/copìado al proyecto)
        source: "cvo-scraper-v1/cvo_scraper_icon.png",
        zipPath: "icons/cvo_scraper_icon.png",
        required: false,
      },
      {
        // Icono histórico del proyecto, si existe
        source: "cvo-scraper-v1/cvo_scraper.ico",
        zipPath: "icons/cvo_scraper.ico",
        required: false,
      },
      {
        // Logo configurado en la carpeta config del scraper
        source: "cvo-scraper-v1/config/logo_CVO_Scraper.ico",
        zipPath: "icons/logo_CVO_Scraper.ico",
        required: false,
      },
      {
        // ChromeDriver opcional: si lo colocas en la raíz del proyecto del scraper se empaqueta
        source: "cvo-scraper-v1/chromedriver.exe",
        zipPath: "chromedriver.exe",
        required: false,
      },
    ],
  },
}

export async function GET(request: NextRequest) {
  try {
    const roles = await getUserRoles()
    if (
      !roles.includes("admin") &&
      !roles.includes("administrador") &&
      !roles.includes("administración")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const bundleKey = searchParams.get("file")

    if (!bundleKey) {
      return NextResponse.json({ error: "Parámetro 'file' requerido" }, { status: 400 })
    }

    const bundle = BUNDLES[bundleKey]
    if (!bundle) {
      return NextResponse.json({ error: "Paquete no permitido" }, { status: 404 })
    }

    const zip = new JSZip()
    const addedFiles: string[] = []

    for (const file of bundle.files) {
      const absolutePath = path.join(process.cwd(), file.source)

      try {
        const data = await fs.readFile(absolutePath)
        zip.file(file.zipPath, data)
        addedFiles.push(file.zipPath)
      } catch (error: any) {
        if (file.required) {
          console.error(
            "[CVO SCRAPER DOWNLOAD] Error leyendo fichero requerido:",
            absolutePath,
            error,
          )
          return NextResponse.json(
            { error: `No se ha podido leer el fichero requerido: ${file.source}` },
            { status: 500 },
          )
        }

        console.warn(
          "[CVO SCRAPER DOWNLOAD] Fichero opcional no encontrado, se omite del ZIP:",
          absolutePath,
        )
      }
    }

    if (addedFiles.length === 0) {
      return NextResponse.json(
        { error: "No se ha podido generar el ZIP: no se ha añadido ningún fichero" },
        { status: 500 },
      )
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${bundle.zipName}"`,
        "Content-Length": zipBuffer.byteLength.toString(),
      },
    })
  } catch (error: any) {
    console.error("[CVO SCRAPER DOWNLOAD] Error inesperado generando ZIP:", error)
    return NextResponse.json(
      {
        error: "Error inesperado al preparar la descarga",
        details: error?.message,
      },
      { status: 500 },
    )
  }
}

