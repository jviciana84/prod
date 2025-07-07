import { NextResponse } from "next/server"

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!publicKey) {
    console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY no está configurada")
    return NextResponse.json({ error: "VAPID key no configurada" }, { status: 500 })
  }

  return NextResponse.json({ publicKey })
}
