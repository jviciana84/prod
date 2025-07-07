import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string[] } }) {
  try {
    const slug = params.slug.join("/")

    // Construir la URL del blob directamente
    const blobUrl = `https://blob.vercel-storage.com/${slug}`

    // Redirigir a la URL del blob
    return NextResponse.redirect(blobUrl)
  } catch (error) {
    console.error("Error al obtener blob:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
