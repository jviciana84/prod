import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST() {
  try {
    console.log("🔍 === PRUEBA TODAS VARIABLES SMTP ===")
    
    // Definir todas las posibles combinaciones de variables SMTP
    const smtpConfigs = [
      {
        name: "SMTP General",
        host: process.env.SMTP_HOST,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
        port: process.env.SMTP_PORT || "465"
      },
      {
        name: "SMTP Entregas",
        host: process.env.SMTP_ENTREGAS_HOST,
        user: process.env.SMTP_ENTREGAS_USER,
        pass: process.env.SMTP_ENTREGAS_PASSWORD,
        port: process.env.SMTP_ENTREGAS_PORT || "465"
      },
      {
        name: "SMTP General (Alternativo)",
        host: process.env.SMTP_HOST,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
        port: process.env.SMTP_PORT || "587"
      },
      {
        name: "SMTP Entregas (Alternativo)",
        host: process.env.SMTP_ENTREGAS_HOST,
        user: process.env.SMTP_ENTREGAS_USER,
        pass: process.env.SMTP_ENTREGAS_PASSWORD,
        port: process.env.SMTP_ENTREGAS_PORT || "587"
      },
      {
        name: "SMTP General (SSL0)",
        host: "ssl0.ovh.net",
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
        port: "465"
      },
      {
        name: "SMTP Entregas (SSL0)",
        host: "ssl0.ovh.net",
        user: process.env.SMTP_ENTREGAS_USER,
        pass: process.env.SMTP_ENTREGAS_PASSWORD,
        port: "465"
      }
    ]

    const results = []

    for (const config of smtpConfigs) {
      // Verificar si la configuración tiene los datos mínimos
      if (!config.host || !config.user || !config.pass) {
        results.push({
          name: config.name,
          success: false,
          error: "Variables no configuradas",
          config: {
            host: config.host || "No configurado",
            user: config.user || "No configurado",
            pass: config.pass ? "***configurado***" : "No configurado",
            port: config.port
          }
        })
        continue
      }

      try {
        console.log(`🧪 Probando: ${config.name}`)
        
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: Number.parseInt(config.port),
          secure: config.port === "465",
          auth: {
            user: config.user,
            pass: config.pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        })

        await transporter.verify()
        
        results.push({
          name: config.name,
          success: true,
          message: "Conexión exitosa",
          config: {
            host: config.host,
            user: config.user,
            pass: "***configurado***",
            port: config.port
          }
        })
        
        console.log(`✅ ${config.name}: Éxito`)
        
      } catch (error: any) {
        results.push({
          name: config.name,
          success: false,
          error: error.message,
          code: error.code,
          config: {
            host: config.host,
            user: config.user,
            pass: "***configurado***",
            port: config.port
          }
        })
        
        console.log(`❌ ${config.name}: ${error.message}`)
      }
    }

    const workingConfig = results.find(r => r.success)
    
    return NextResponse.json({
      success: !!workingConfig,
      results,
      workingConfig: workingConfig ? {
        name: workingConfig.name,
        config: workingConfig.config
      } : null,
      timestamp: new Date().toISOString(),
      recommendations: workingConfig ? [
        `Usar configuración: ${workingConfig.name}`,
        "Actualizar el código para usar esta configuración"
      ] : [
        "Ninguna configuración SMTP funcionó",
        "OVH puede estar bloqueando Vercel",
        "Verificar configuración en OVH"
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