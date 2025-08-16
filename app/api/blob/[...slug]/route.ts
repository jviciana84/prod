import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await params
    const slugPath = slug.join("/")

    // Construir la URL del blob directamente
    const blobUrl = `https://blob.vercel-storage.com/${slugPath}`

    // Redirigir a la URL del blob
    return NextResponse.redirect(blobUrl)
  } catch (error) {
    console.error("Error al obtener blob:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
