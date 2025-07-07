import { NextResponse } from "next/server"
import imaps from "imap-simple"
import { simpleParser } from "mailparser"
import type { ParsedMail } from "mailparser"

// Configuración para la conexión IMAP
const config = {
  imap: {
    user: process.env.IMAP_USER || "",
    password: process.env.IMAP_PASSWORD || "",
    host: process.env.IMAP_HOST || "",
    port: Number.parseInt(process.env.IMAP_PORT || "993", 10),
    tls: process.env.IMAP_TLS === "true",
    // Se elimina authTimeout para usar el valor por defecto de la librería
  },
}

// Función para procesar un email
async function processEmail(email: ParsedMail) {
  console.log(`Procesando email de: ${email.from?.text}`)
  console.log(`Asunto: ${email.subject}`)

  const attachments = email.attachments.map((att) => ({
    filename: att.filename,
    contentType: att.contentType,
    size: att.size,
  }))

  return {
    from: email.from?.text,
    subject: email.subject,
    date: email.date,
    attachments,
  }
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
      message: `Proceso completado. Se procesaron ${processedEmails.length} correos.`,
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
