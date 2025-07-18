import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envValues = {
      SMTP_ENTREGAS_HOST: process.env.SMTP_ENTREGAS_HOST || "No configurado",
      SMTP_ENTREGAS_USER: process.env.SMTP_ENTREGAS_USER || "No configurado",
      SMTP_ENTREGAS_PASSWORD: process.env.SMTP_ENTREGAS_PASSWORD ? 
        `${process.env.SMTP_ENTREGAS_PASSWORD.substring(0, 3)}***${process.env.SMTP_ENTREGAS_PASSWORD.substring(process.env.SMTP_ENTREGAS_PASSWORD.length - 1)}` : 
        "No configurado",
      SMTP_ENTREGAS_PORT: process.env.SMTP_ENTREGAS_PORT || "465",
    }

    const lengths = {
      host_length: process.env.SMTP_ENTREGAS_HOST?.length || 0,
      user_length: process.env.SMTP_ENTREGAS_USER?.length || 0,
      password_length: process.env.SMTP_ENTREGAS_PASSWORD?.length || 0,
      port_length: process.env.SMTP_ENTREGAS_PORT?.length || 0,
    }

    const hasSpaces = {
      host_has_spaces: process.env.SMTP_ENTREGAS_HOST?.includes(' ') || false,
      user_has_spaces: process.env.SMTP_ENTREGAS_USER?.includes(' ') || false,
      password_has_spaces: process.env.SMTP_ENTREGAS_PASSWORD?.includes(' ') || false,
    }

    return NextResponse.json({
      success: true,
      envValues,
      lengths,
      hasSpaces,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 