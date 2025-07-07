import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  generateRegistroEmailHTML,
  generateTramitacionEmailHTML,
  generateConfirmacionEmailHTML,
  generateRechazoEmailHTML,
} from "@/lib/email-templates/extorno-email-templates"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const extornoId = searchParams.get("extornoId")
    const type = searchParams.get("type") as "registro" | "tramitacion" | "confirmacion" | "rechazo"

    if (!extornoId || !type) {
      return NextResponse.json({ error: "Missing required query parameters: extornoId, type" }, { status: 400 })
    }

    // Obtener datos del extorno REAL de la base de datos
    const { data: extorno, error: extornoError } = await supabase
      .from("extornos")
      .select("*")
      .eq("id", Number.parseInt(extornoId))
      .single()

    if (extornoError || !extorno) {
      console.error("Error fetching extorno:", extornoError)
      return NextResponse.json({ error: "Extorno not found" }, { status: 404 })
    }

    let emailContent: string
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    // Usar las MISMAS funciones que se usan en el envío real
    switch (type) {
      case "registro":
        emailContent = generateRegistroEmailHTML(extorno)
        break
      case "tramitacion":
        emailContent = generateTramitacionEmailHTML(extorno)
        break
      case "confirmacion":
        // Para confirmación, necesitamos generar un token temporal para la previsualización
        const extornoConToken = {
          ...extorno,
          confirmation_token: "preview-token-12345",
        }
        emailContent = generateConfirmacionEmailHTML(extornoConToken)
        break
      case "rechazo":
        emailContent = generateRechazoEmailHTML(extorno)
        break
      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }

    return new NextResponse(emailContent, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error generating email preview HTML:", error)
    return NextResponse.json(
      { error: "Failed to generate email preview", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
