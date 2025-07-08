import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { incentivo, importe, config } = await request.json()

    console.log("📧 === INICIO ENVÍO EMAIL INCENTIVO ===")
    console.log("📧 Datos recibidos:", JSON.stringify({ incentivo, importe }, null, 2))

    // Verificar variables SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("❌ Configuración SMTP incompleta")
      return NextResponse.json({
        success: false,
        message: "Configuración SMTP incompleta",
      })
    }

    // Configuración del transporter - CORREGIDO: createTransport (no createTransporter)
    console.log("📧 Configurando transporter...")
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Verificar conexión SMTP
    try {
      await transporter.verify()
      console.log("✅ Conexión SMTP verificada correctamente")
    } catch (verifyError) {
      console.error("❌ Error verificando conexión SMTP:", verifyError)
      return NextResponse.json({
        success: false,
        message: "Error de conexión SMTP",
        error: verifyError.message,
      })
    }

    // Generar contenido del email
    const htmlContent = generateIncentiveEmailHTML(incentivo, importe, config)

    // Preparar asunto
    const fechaFormateada = incentivo.fecha_entrega
      ? new Date(incentivo.fecha_entrega).toLocaleDateString("es-ES")
      : "Sin fecha"

    const subject = `Incentivo ${incentivo.matricula} - ${incentivo.asesor} - ${fechaFormateada} - ${importe.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`

    // Preparar destinatarios
    const recipients = ["incentivos@controlvo.ovh"]

    // Añadir CC si está configurado
    const ccEmails = process.env.INCENTIVOS_CC_EMAILS ? process.env.INCENTIVOS_CC_EMAILS.split(",") : []

    // Preparar opciones del email
    const mailOptions = {
      from: `Incentivos - Sistema CVO <${process.env.SMTP_USER}>`,
      to: recipients.join(","),
      cc: ccEmails.length > 0 ? ccEmails.join(",") : undefined,
      subject: subject,
      html: htmlContent,
      text: `Incentivo para ${incentivo.matricula} - Asesor: ${incentivo.asesor} - Importe: ${importe.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`,
    }

    console.log("📧 Opciones finales del email:", {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
    })

    // Enviar email
    console.log("📧 Enviando email...")
    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Email enviado exitosamente:", result.messageId)

    return NextResponse.json({
      success: true,
      message: "Email enviado exitosamente",
      messageId: result.messageId,
      recipients: {
        to: mailOptions.to,
        cc: mailOptions.cc,
      },
    })
  } catch (error) {
    console.error("❌ Error crítico enviando email:", error)
    return NextResponse.json({
      success: false,
      message: "Error crítico enviando email",
      error: error.message,
    })
  }
}

function generateIncentiveEmailHTML(incentivo: any, importe: number, config: any) {
  const margen = (incentivo.precio_venta || 0) - (incentivo.precio_compra || 0)

  return `
<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa;">
   <div style="max-width: 800px; margin: 0 auto; background-color: white; padding: 25px; border-radius: 8px;">
       <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e9ecef;">
           <h2 style="margin: 0; color: #495057;">Detalle de Incentivo</h2>
       </div>
       
       <div style="margin-bottom: 20px; font-size: 16px;">
           Estimados compañeros,
       </div>
       
       <div style="margin-bottom: 25px; font-size: 16px; font-weight: 500; color: #495057;">
           Se ha generado el siguiente incentivo para el asesor <strong>${incentivo.asesor}</strong>:
       </div>

       <div style="margin-bottom: 20px;">
           <div style="background-color: #28a745; color: white; padding: 12px; font-weight: bold; text-transform: uppercase; text-align: left; font-size: 14px; margin-bottom: 0;">
               DATOS DEL VEHÍCULO
           </div>
           <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #dee2e6;">
               <tbody>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Matrícula</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${incentivo.matricula}</td>
                   </tr>
                   <tr style="background-color: #f8f9fa;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Modelo</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${incentivo.modelo}</td>
                   </tr>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">OR</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${incentivo.or || "-"}</td>
                   </tr>
                   <tr style="background-color: #f8f9fa;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Fecha Entrega</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${incentivo.fecha_entrega ? new Date(incentivo.fecha_entrega).toLocaleDateString("es-ES") : "-"}</td>
                   </tr>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Asesor</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${incentivo.asesor}</td>
                   </tr>
                   <tr style="background-color: #f8f9fa;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Forma de Pago</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${incentivo.forma_pago}</td>
                   </tr>
               </tbody>
           </table>
       </div>

       <div style="margin-bottom: 20px;">
           <div style="background-color: #007bff; color: white; padding: 12px; font-weight: bold; text-transform: uppercase; text-align: left; font-size: 14px; margin-bottom: 0;">
               DATOS ECONÓMICOS
           </div>
           <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #dee2e6;">
               <tbody>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Precio Venta</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; color: #28a745;">${(incentivo.precio_venta || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                   </tr>
                   <tr style="background-color: #f8f9fa;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Precio Compra</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${(incentivo.precio_compra || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                   </tr>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Margen</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; color: #007bff;">${margen.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                   </tr>
                   <tr style="background-color: #f8f9fa;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Días en Stock</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${incentivo.dias_stock || 0} días</td>
                   </tr>
               </tbody>
           </table>
       </div>

       <div style="margin-bottom: 20px;">
           <div style="background-color: #6c757d; color: white; padding: 12px; font-weight: bold; text-transform: uppercase; text-align: left; font-size: 14px; margin-bottom: 0;">
               DESGLOSE DEL CÁLCULO
           </div>
           <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #dee2e6;">
               <tbody>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Importe Mínimo</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6;">${(incentivo.importe_minimo || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                   </tr>
                   <tr style="background-color: #f8f9fa;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Gastos Estructura</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545;">-${(incentivo.gastos_estructura || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                   </tr>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Garantía</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545;">
                         ${incentivo.garantia === 0 ? "Fabricante (0€)" : `-${(incentivo.garantia || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`}
                       </td>
                   </tr>
                   <tr style="background-color: #f8f9fa;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Gastos 360</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6; color: #dc3545;">-${(incentivo.gastos_360 || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                   </tr>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Antigüedad</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745;">${incentivo.antiguedad ? "+50,00€" : "0,00€"}</td>
                   </tr>
                   <tr style="background-color: #f8f9fa;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Financiado</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745;">${incentivo.financiado ? "+50,00€" : "0,00€"}</td>
                   </tr>
                   <tr style="background-color: white;">
                       <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Otros</td>
                       <td style="padding: 12px; border: 1px solid #dee2e6; color: #28a745;">+${(incentivo.otros || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                   </tr>
               </tbody>
           </table>
       </div>

       <!-- Importe final destacado -->
       <div style="margin: 30px 0; text-align: center; padding: 20px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px;">
           <h3 style="margin: 0 0 15px 0; color: #155724;">IMPORTE TOTAL DEL INCENTIVO</h3>
           <p style="margin: 0; color: #155724; font-weight: bold; font-size: 24px;">
               ${importe.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
           </p>
       </div>

       ${
         incentivo.otros_observaciones
           ? `
       <div style="margin-bottom: 20px;">
           <div style="background-color: #ffc107; color: #212529; padding: 12px; font-weight: bold; text-transform: uppercase; text-align: left; font-size: 14px; margin-bottom: 0;">
               OBSERVACIONES
           </div>
           <div style="padding: 12px; border: 1px solid #dee2e6; background-color: #fff3cd;">
               ${incentivo.otros_observaciones}
           </div>
       </div>
       `
           : ""
       }

       <div style="margin: 30px 0 20px 0; font-size: 16px;">
           Atentamente,<br>
           <strong>Sistema de Incentivos CVO</strong>
       </div>

       <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; font-style: italic; text-align: center;">
           Este es un mensaje automático, por favor no responda a este correo.
       </div>
       
       <div style="margin-top: 40px; text-align: center; color: #6c757d; font-size: 12px;">
           <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
           Control Vehículos de Ocasión | ${new Date().getFullYear()}
       </div>
   </div>
</body>
</html>`
}
