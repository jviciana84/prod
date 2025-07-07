import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Usar fetch directo a Supabase REST API
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: "Variables de entorno faltantes",
      })
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/user_push_subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: "00000000-0000-0000-0000-000000000000",
        endpoint: body.endpoint || "test-endpoint",
        p256dh: body.p256dh || "test-p256dh",
        auth: body.auth || "test-auth",
      }),
    })

    if (response.ok) {
      return NextResponse.json({ success: true, message: "Insertado correctamente" })
    } else {
      const error = await response.text()
      return NextResponse.json({
        success: false,
        error: error,
        status: response.status,
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
