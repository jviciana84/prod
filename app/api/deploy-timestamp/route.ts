import { NextResponse } from "next/server"

// Usar el timestamp de cuando se construyó la aplicación
const BUILD_TIMESTAMP = process.env.VERCEL_GIT_COMMIT_SHA || new Date().toISOString()

export async function GET() {
  return NextResponse.json({
    timestamp: BUILD_TIMESTAMP,
    success: true,
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
}
