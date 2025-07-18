import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST() {
  try {
    console.log("🔐 === PRUEBA MÉTODOS AUTENTICACIÓN OVH ===")
    
    const authMethods = [
      {
        name: "PLAIN (por defecto)",
        config: {
          host: "smtp.mail.ovh.net",
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_ENTREGAS_USER,
            pass: process.env.SMTP_ENTREGAS_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
      },
      {
        name: "LOGIN explícito",
        config: {
          host: "smtp.mail.ovh.net",
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_ENTREGAS_USER,
            pass: process.env.SMTP_ENTREGAS_PASSWORD,
            type: 'login'
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
      },
      {
        name: "CRAM-MD5",
        config: {
          host: "smtp.mail.ovh.net",
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_ENTREGAS_USER,
            pass: process.env.SMTP_ENTREGAS_PASSWORD,
            type: 'cram-md5'
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
      },
      {
        name: "Puerto 587 con STARTTLS",
        config: {
          host: "smtp.mail.ovh.net",
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_ENTREGAS_USER,
            pass: process.env.SMTP_ENTREGAS_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
          requireTLS: true,
        }
      },
      {
        name: "SSL0 con configuración OVH",
        config: {
          host: "ssl0.ovh.net",
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_ENTREGAS_USER,
            pass: process.env.SMTP_ENTREGAS_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
          requireTLS: true,
          secureConnection: true,
        }
      }
    ]

    const results = []

    for (const authMethod of authMethods) {
      try {
        console.log(`🧪 Probando: ${authMethod.name}`)
        
        const transporter = nodemailer.createTransport(authMethod.config)
        await transporter.verify()
        
        results.push({
          name: authMethod.name,
          success: true,
          message: "Autenticación exitosa"
        })
        
        console.log(`✅ ${authMethod.name}: Éxito`)
        
      } catch (error: any) {
        results.push({
          name: authMethod.name,
          success: false,
          error: error.message,
          code: error.code,
          response: error.response
        })
        
        console.log(`❌ ${authMethod.name}: ${error.message}`)
      }
    }

    const workingMethod = results.find(r => r.success)
    
    return NextResponse.json({
      success: !!workingMethod,
      results,
      workingMethod: workingMethod?.name || null,
      timestamp: new Date().toISOString(),
      recommendations: workingMethod ? [
        `Usar método: ${workingMethod.name}`,
        "Actualizar configuración en el código principal"
      ] : [
        "Ningún método de autenticación funcionó",
        "OVH puede tener restricciones de IP para Vercel",
        "Considerar usar un servicio SMTP alternativo"
      ]
    })
    
  } catch (error: any) {
    console.error("❌ Error general:", error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 