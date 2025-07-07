import { NextResponse } from "next/server"
import { generateMovementEmailHTML } from "@/lib/email-templates/movement-email-templates"

export async function GET() {
  try {
    // Datos de ejemplo para la previsualización
    const movementData = {
      fecha: "15/01/2025",
      usuario_entrega: "Juan Pérez",
      email_entrega: "juan.perez@ejemplo.com",
      movimientos: [
        {
          usuario_recibe: "María García",
          email_recibe: "maria.garcia@ejemplo.com",
          items: [
            {
              matricula: "1234ABC",
              material: "Llaves del vehículo",
              observaciones: "En perfecto estado",
            },
            {
              matricula: "5678DEF",
              material: "Documentación",
              observaciones: "",
            },
          ],
        },
        {
          usuario_recibe: "Carlos López",
          email_recibe: "carlos.lopez@ejemplo.com",
          items: [
            {
              matricula: "9012GHI",
              material: "Tarjeta de combustible",
              observaciones: "Verificar saldo",
            },
          ],
        },
      ],
    }

    // Usar la MISMA función que se usa en el envío real
    const emailContent = generateMovementEmailHTML(movementData)

    return new NextResponse(emailContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error generando previsualización de movimiento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
