import { NextResponse } from "next/server"
import imaps from "imap-simple"
import { simpleParser } from "mailparser"
import type { ParsedMail } from "mailparser"

const config = {
  imap: {
    user: process.env.IMAP_USER || "",
    password: process.env.IMAP_PASSWORD || "",
    host: process.env.IMAP_HOST || "",
    port: Number.parseInt(process.env.IMAP_PORT || "993", 10),
    tls: process.env.IMAP_TLS === "true",
  },
}

async function processEmail(email: ParsedMail) {
  // Preparar payload para el procesador Docuware
  const payload = {
    from: email.from?.text || "",
    to: email.to ? (Array.isArray(email.to) ? email.to.map(t => t.address) : [email.to.address]) : [],
    subject: email.subject || "",
    textBody: email.text || "",
    htmlBody: email.html || "",
    date: email.date ? email.date.toISOString() : new Date().toISOString(),
    messageId: email.messageId || ""
  }

  // Log antes de llamar al procesador
  console.log("Llamando a /api/docuware/email-processor con payload:", payload);

  // Llamar al procesador Docuware
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const res = await fetch(`${siteUrl}/api/docuware/email-processor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  const result = await res.json()
  // Log de la respuesta
  console.log("Respuesta de /api/docuware/email-processor:", result);
  return { ...payload, docuwareResult: result }
}

export async function GET() {
  if (!config.imap.user || !config.imap.password || !config.imap.host || !config.imap.port) {
    return NextResponse.json(
      {
        error: "Faltan una o más variables de entorno IMAP (IMAP_USER, IMAP_PASSWORD, IMAP_HOST, IMAP_PORT).",
      },
      { status: 500 },
    )
  }

  let connection: imaps.ImapSimple | null = null

  try {
    connection = await imaps.connect(config)
    await connection.openBox("INBOX")

    const searchCriteria = ["UNSEEN"]
    const fetchOptions = {
      bodies: [""],
      markSeen: true,
    }

    const messages = await connection.search(searchCriteria, fetchOptions)
    const processedEmails = []

    for (const item of messages) {
      const all = item.parts.find((part) => part.which === "")
      if (all) {
        const rawEmail = all.body
        const parsedEmail = await simpleParser(rawEmail)
        const processedData = await processEmail(parsedEmail)
        processedEmails.push(processedData)
      }
    }

    if (connection) {
      connection.end()
    }

    return NextResponse.json({
      message: `Proceso completado. Se procesaron ${processedEmails.length} correos y se intentaron registrar en Docuware.`,
      processedEmails,
    })
  } catch (error: any) {
    console.error("Error al procesar correos:", error)
    if (connection) {
      connection.end()
    }
    return NextResponse.json({ error: `Error al conectar o procesar correos: ${error.message}` }, { status: 500 })
  }
}
