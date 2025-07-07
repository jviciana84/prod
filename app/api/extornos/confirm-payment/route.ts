import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error - Token Requerido</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Error</h2>
            <p>Token de confirmación requerido.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      )
    }

    console.log("🔍 Confirmando pago con token:", token)

    // Obtener la IP del request
    let ip = request.headers.get("x-forwarded-for") || "desconocida";
    if (ip && ip.includes(",")) ip = ip.split(",")[0].trim();

    // Llamar a la función RPC para confirmar el pago
    const { data, error } = await supabase.rpc("confirm_extorno_payment", {
      token_to_confirm: token,
    })

    // Si la confirmación fue exitosa, guardar la IP
    if (data && data[0] && data[0].success && data[0].extorno_id) {
      await supabase.from("extornos").update({ ultima_ip_confirmacion: ip }).eq("id", data[0].extorno_id);
    }

    if (error) {
      console.error("❌ Error en RPC confirm_extorno_payment:", error)
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error - Confirmación Fallida</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 5px; }
            .details { background: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 3px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Error al Confirmar Pago</h2>
            <p>No se pudo confirmar el pago del extorno.</p>
            <div class="details">
              <strong>Detalles técnicos:</strong><br>
              Código: ${error.code}<br>
              Mensaje: ${error.message}
            </div>
          </div>
        </body>
        </html>
        `,
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      )
    }

    if (!data || data.length === 0) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Token No Válido</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="warning">
            <h2>⚠️ Token No Válido</h2>
            <p>El token de confirmación no es válido o ya ha sido utilizado.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      )
    }

    const result = data[0]

    if (!result.success) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Confirmación Fallida</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="warning">
            <h2>⚠️ ${result.message}</h2>
            <p>No se pudo confirmar el pago del extorno.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      )
    }

    console.log("✅ Pago confirmado exitosamente para extorno:", result.extorno_id)

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pago Confirmado</title>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            background: #f8f9fa;
          }
          .success { 
            background: #d4edda; 
            border: 1px solid #c3e6cb; 
            padding: 30px; 
            border-radius: 10px; 
            text-align: center;
          }
          .details {
            background: white;
            padding: 20px;
            margin-top: 20px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #495057;
          }
          .value {
            color: #212529;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ Pago Confirmado</h1>
          <p>El pago del extorno ha sido confirmado correctamente desde la IP: <b>${ip}</b>.</p>
          <p style="font-size:0.95em;color:#555;">Si no has realizado esta acción, por favor contacta con el administrador.</p>
        </div>
        <div class="details">
          <h3>Detalles del Extorno</h3>
          <div class="detail-row">
            <span class="label">Matrícula:</span>
            <span class="value">${result.matricula}</span>
          </div>
          <div class="detail-row">
            <span class="label">Cliente:</span>
            <span class="value">${result.cliente}</span>
          </div>
          <div class="detail-row">
            <span class="label">Importe:</span>
            <span class="value">${new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(result.importe)}</span>
          </div>
          <div class="detail-row">
            <span class="label">ID Extorno:</span>
            <span class="value">#${result.extorno_id}</span>
          </div>
          <div class="detail-row">
            <span class="label">Estado:</span>
            <span class="value">REALIZADO</span>
          </div>
          <div class="detail-row">
            <span class="label">Fecha de Confirmación:</span>
            <span class="value">${new Date().toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
          <div class="detail-row">
            <span class="label">IP de Confirmación:</span>
            <span class="value">${ip}</span>
          </div>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    )
  } catch (error) {
    console.error("❌ Error crítico en confirm-payment:", error)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error del Sistema</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Error del Sistema</h2>
          <p>Ha ocurrido un error inesperado. Por favor, contacte al administrador.</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    )
  }
}
