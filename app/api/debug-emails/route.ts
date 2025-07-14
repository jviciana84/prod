import { NextResponse } from "next/server"
import imaps from "imap-simple"
import { simpleParser } from "mailparser"

const config = {
  imap: {
    user: process.env.IMAP_USER || "",
    password: process.env.IMAP_PASSWORD || "",
    host: process.env.IMAP_HOST || "",
    port: Number.parseInt(process.env.IMAP_PORT || "993", 10),
    tls: process.env.IMAP_TLS === "true",
  },
}

export async function GET() {
  if (!config.imap.user || !config.imap.password || !config.imap.host || !config.imap.port) {
    return NextResponse.json(
      {
        error: "Faltan variables de entorno IMAP",
      },
      { status: 500 },
    )
  }

  let connection: imaps.ImapSimple | null = null

  try {
    connection = await imaps.connect(config)
    await connection.openBox("INBOX")

    const searchCriteria = ["ALL"]
    const fetchOptions = {
      bodies: [""],
      markSeen: false,
    }

    const messages = await connection.search(searchCriteria, fetchOptions)
    console.log(`📧 Encontrados ${messages.length} emails en total`)
    
    const emailDetails = []
    
    for (let i = 0; i < Math.min(messages.length, 5); i++) {
      const item = messages[i]
      const all = item.parts.find((part) => part.which === "")
      if (all) {
        const rawEmail = all.body
        const parsedEmail = await simpleParser(rawEmail)
        
        // Extraer direcciones
        let toAddresses: string[] = []
        if (parsedEmail.to) {
          if ('value' in parsedEmail.to && Array.isArray(parsedEmail.to.value)) {
            toAddresses = parsedEmail.to.value.map(t => t.address).filter(addr => addr)
          } else if (Array.isArray(parsedEmail.to)) {
            toAddresses = parsedEmail.to.map(t => t.address).filter(addr => addr)
          } else {
            toAddresses = parsedEmail.to.address ? [parsedEmail.to.address] : []
          }
        }
        
        let fromAddress = ""
        if (typeof parsedEmail.from === "string") {
          fromAddress = parsedEmail.from
        } else if (parsedEmail.from && typeof parsedEmail.from === "object") {
          if ('value' in parsedEmail.from && Array.isArray(parsedEmail.from.value) && parsedEmail.from.value.length > 0) {
            fromAddress = parsedEmail.from.value[0].address || ""
          } else if (parsedEmail.from.address) {
            fromAddress = parsedEmail.from.address
          } else if (parsedEmail.from.text) {
            fromAddress = parsedEmail.from.text
          }
        }
        
        const isForMaterial = toAddresses.some(email => 
          email.toLowerCase().includes('material@controlvo.ovh')
        )
        
        emailDetails.push({
          from: fromAddress,
          to: toAddresses,
          subject: parsedEmail.subject,
          messageId: parsedEmail.messageId,
          isForMaterial,
          textLength: parsedEmail.text?.length || 0
        })
      }
    }
    
    if (connection) {
      connection.end()
    }

    return NextResponse.json({
      success: true,
      totalEmails: messages.length,
      emailDetails
    })
  } catch (error: any) {
    console.error("Error al procesar correos:", error)
    if (connection) {
      connection.end()
    }
    return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
  }
} 