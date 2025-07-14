import { NextResponse } from "next/server"
import imaps from "imap-simple"
import { simpleParser } from "mailparser"
import type { ParsedMail } from "mailparser"
import { createClient } from "@supabase/supabase-js"

const config = {
  imap: {
    user: process.env.IMAP_USER || "",
    password: process.env.IMAP_PASSWORD || "",
    host: process.env.IMAP_HOST || "",
    port: Number.parseInt(process.env.IMAP_PORT || "993", 10),
    tls: process.env.IMAP_TLS === "true",
  },
}

// Función para guardar email en received_emails
async function saveToReceivedEmails(emailData: any) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("❌ Variables de entorno de Supabase no definidas para received_emails")
      return false
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('received_emails')
      .insert({
        from_email: emailData.from,
        to_email: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        body: emailData.textBody,
        message_id: emailData.messageId,
        received_date: emailData.date,
        processed: true
      })

    if (error) {
      console.error("❌ Error guardando en received_emails:", error)
      return false
    }

    console.log("✅ Email guardado en received_emails")
    return true
  } catch (error) {
    console.error("❌ Error en saveToReceivedEmails:", error)
    return false
  }
}

async function processEmail(email: ParsedMail) {
  // Log del email original para debug
  console.log("Email original:", {
    from: email.from,
    to: email.to,
    subject: email.subject,
    messageId: email.messageId
  });

  // Extraer correctamente el campo "to"
  let toAddresses: string[] = [];
  
  if (email.to) {
    // Si email.to tiene la propiedad 'value', usarla
    if ('value' in email.to && Array.isArray(email.to.value)) {
      toAddresses = email.to.value.map(t => t.address).filter(addr => addr);
    } else if (Array.isArray(email.to)) {
      toAddresses = email.to.map(t => t.address).filter(addr => addr);
    } else {
      toAddresses = email.to.address ? [email.to.address] : [];
    }
  }

  // Si no se encontraron direcciones en "to", intentar con "cc" o "bcc"
  if (toAddresses.length === 0) {
    if (email.cc) {
      if ('value' in email.cc && Array.isArray(email.cc.value)) {
        toAddresses = email.cc.value.map(t => t.address).filter(addr => addr);
      } else if (Array.isArray(email.cc)) {
        toAddresses = email.cc.map(t => t.address).filter(addr => addr);
      } else {
        toAddresses = email.cc.address ? [email.cc.address] : [];
      }
    }
  }

  // Si aún no hay direcciones, intentar con "bcc"
  if (toAddresses.length === 0 && email.bcc) {
    if ('value' in email.bcc && Array.isArray(email.bcc.value)) {
      toAddresses = email.bcc.value.map(t => t.address).filter(addr => addr);
    } else if (Array.isArray(email.bcc)) {
      toAddresses = email.bcc.map(t => t.address).filter(addr => addr);
    } else {
      toAddresses = email.bcc.address ? [email.bcc.address] : [];
    }
  }

  // --- CORRECCIÓN DEL CAMPO FROM ---
  let fromAddress = "";
  if (typeof email.from === "string") {
    fromAddress = email.from;
  } else if (email.from && typeof email.from === "object") {
    if ('value' in email.from && Array.isArray(email.from.value) && email.from.value.length > 0) {
      fromAddress = email.from.value[0].address || "";
    } else if (email.from.address) {
      fromAddress = email.from.address;
    } else if (email.from.text) {
      fromAddress = email.from.text;
    }
  }

  console.log("Direcciones extraídas:", toAddresses);
  console.log("From extraído:", fromAddress);

  // Preparar payload para el procesador Docuware
  const payload = {
    from: fromAddress,
    to: toAddresses,
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

    // Cambiar para ver TODOS los emails, no solo los no leídos
    const searchCriteria = ["ALL"] // Cambiado de ["UNSEEN"] a ["ALL"]
    const fetchOptions = {
      bodies: [""],
      markSeen: false, // Cambiado a false para no marcar como leídos
    }

    const messages = await connection.search(searchCriteria, fetchOptions)
    console.log(`📧 Encontrados ${messages.length} emails en total`)
    
    console.log(`📧 Procesando ${messages.length} emails...`)
    
    let processedCount = 0
    let insertedCount = 0

    for (const item of messages) {
      try {
        console.log(`\n🔄 Procesando email ${processedCount + 1}/${messages.length}:`)
      const all = item.parts.find((part) => part.which === "")
      if (all) {
        const rawEmail = all.body
        const parsedEmail = await simpleParser(rawEmail)
        const processedData = await processEmail(parsedEmail)
          console.log(`   From: ${parsedEmail.from}`)
          console.log(`   To: ${parsedEmail.to}`)
          console.log(`   Subject: ${parsedEmail.subject}`)
          console.log(`   MessageId: ${parsedEmail.messageId}`)
          
          // Extraer correctamente los emails
          const from = parsedEmail.from?.value?.[0]?.address || parsedEmail.from?.text || '';
          const to = parsedEmail.to?.value?.map((v: any) => v.address) || [];
          
          const docuwarePayload: DocuwareEmailPayload = {
            from,
            to,
            subject: parsedEmail.subject,
            textBody: parsedEmail.text || '',
            htmlBody: parsedEmail.html || '',
            date: parsedEmail.date,
            messageId: parsedEmail.messageId
          }
          
          // Guardar en received_emails primero
          console.log('💾 Guardando en received_emails...')
          await saveToReceivedEmails(docuwarePayload)
          
          console.log('Llamando a /api/docuware/email-processor con payload:', docuwarePayload)
          
          // Usar URL local fija para evitar problemas de variable de entorno
          const docuwareResponse = await fetch(`http://localhost:3000/api/docuware/email-processor`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(docuwarePayload),
          })
          
          if (docuwareResponse.ok) {
            const docuwareResult = await docuwareResponse.json()
            console.log(`   ✅ Procesador Docuware: ${docuwareResult.message}`)
            if (docuwareResult.inserted) {
              insertedCount++
              console.log(`   📝 ✅ Solicitud insertada en base de datos`)
            } else {
              console.log(`   ⚠️ Solicitud NO insertada: ${docuwareResult.reason || 'No se especificó razón'}`)
            }
          } else {
            console.log(`   ❌ Error en procesador Docuware: ${docuwareResponse.status}`)
          }
        }
        processedCount++
      } catch (error) {
        console.error(`❌ Error procesando email ${processedCount + 1}:`, error)
        processedCount++
      }
    }
    
    console.log(`\n📊 RESUMEN:`)
    console.log(`   Emails procesados: ${processedCount}`)
    console.log(`   Solicitudes insertadas: ${insertedCount}`)

    if (connection) {
      connection.end()
    }

    return NextResponse.json({
      success: true,
      message: `Procesamiento completado. ${processedCount} emails procesados, ${insertedCount} solicitudes insertadas.`,
      processed: processedCount,
      inserted: insertedCount
    })
  } catch (error: any) {
    console.error("Error al procesar correos:", error)
    if (connection) {
      connection.end()
    }
    return NextResponse.json({ error: `Error al conectar o procesar correos: ${error.message}` }, { status: 500 })
  }
}
