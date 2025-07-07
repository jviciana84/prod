import { getExtornoEmailTemplate } from "./email-styles"

interface ExtornoData {
  id: string
  matricula: string
  cliente: string
  asesor: string
  importe: number
  motivo: string
  observaciones?: string
  fecha_solicitud: string
  estado: string
  confirmation_token?: string
  numero_cliente?: string
  concesion?: number
  numero_cuenta?: string
  registrado_por_nombre: string
  registrado_por_id: string
}

export function generateRegistroEmailHTML(extorno: ExtornoData, tablaAdjuntosHtml: string = ""): string {
  let clienteTexto = extorno.cliente || ''
  if (extorno.numero_cliente) {
    clienteTexto += ` <b>CL. (${extorno.numero_cliente})</b>`
  }

  let concesionTexto = ''
  if (extorno.concesion === 1 || extorno.concesion === '1') {
    concesionTexto = 'Motor Munich SA'
  } else if (extorno.concesion === 2 || extorno.concesion === '2') {
    concesionTexto = 'Motor Munich Cadí SL'
  } else {
    concesionTexto = extorno.concesion || ''
  }

  const filas = [
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;width:180px;'>Matrícula</td><td style='padding:8px 12px;'>${extorno.matricula}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Cliente</td><td style='padding:8px 12px;'>${clienteTexto}</td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Concepto</td><td style='padding:8px 12px;'>${extorno.motivo || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Importe</td><td style='padding:8px 12px;'><strong>${Number(extorno.importe).toLocaleString('es-ES', {minimumFractionDigits:2})} €</strong></td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Número de Cuenta</td><td style='padding:8px 12px;font-family:monospace;'>${extorno.numero_cuenta || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Concesión</td><td style='padding:8px 12px;'>${concesionTexto}</td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Fecha</td><td style='padding:8px 12px;'>${extorno.fecha_solicitud || extorno.created_at || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Registrado por</td><td style='padding:8px 12px;'>${extorno.registrado_por_nombre} <i>(${extorno.registrado_por_id})</i></td></tr>`
  ]

  const content = `
    <div style="background:#FFB300;color:#fff;padding:24px 24px 18px 24px;border-radius:8px 8px 0 0;font-size:1.7em;font-weight:bold;letter-spacing:0.5px;margin-bottom:0;">
      Nueva Solicitud de Extorno
    </div>
    <div style="background:#FFB300;color:#fff;padding:18px 24px 12px 24px;border-radius:8px 8px 0 0;font-size:1.25em;font-weight:bold;letter-spacing:0.5px;margin-bottom:0;">
      Notificación de nueva solicitud de extorno
    </div>
    <p style="margin-bottom: 16px;">Estimados compañeros,</p>
    <p style="margin-bottom: 24px;"><strong>${extorno.registrado_por_nombre}</strong> ha registrado el siguiente extorno:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr style="background:#FFB300;color:#fff;">
        <th colspan="2" style="padding:10px 12px;text-align:left;font-size:1.1em;">DETALLES DEL EXTORNO</th>
      </tr>
      ${filas.join('\n')}
    </table>
    ${tablaAdjuntosHtml}
    <div style='margin-top:32px;'>
      <b>Atentamente</b><br/>
      <span style='font-style:italic;font-size:0.95em;'>Sistema de Gestión - CVO</span>
    </div>
  `

  return getExtornoEmailTemplate(content, "Nueva Solicitud de Extorno")
}

export function generateTramitacionEmailHTML(extorno: ExtornoData): string {
  const content = `
    <p class="paragraph">Su solicitud de extorno está siendo procesada:</p>
    
    <table class="detail-table">
      <tr class="detail-row">
        <td class="detail-label">ID Extorno</td>
        <td class="detail-value">#${extorno.id}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Matrícula</td>
        <td class="detail-value" style="font-family: monospace; font-weight: bold;">${extorno.matricula}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Cliente</td>
        <td class="detail-value">${extorno.cliente}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Importe</td>
        <td class="detail-value"><span class="amount">${extorno.importe.toFixed(2)} €</span></td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Estado</td>
        <td class="detail-value"><span class="status status-${extorno.estado.toLowerCase()}">${extorno.estado}</span></td>
      </tr>
    </table>

    <div class="info-box">
      <p style="margin: 0;"><strong>⏳ En proceso:</strong> Su solicitud está siendo revisada. Le notificaremos cuando esté lista para confirmación.</p>
    </div>
  `

  return getExtornoEmailTemplate(content, "Extorno en Tramitación")
}

export function generateConfirmacionEmailHTML(extorno: ExtornoData): string {
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/extornos/confirmacion?token=${extorno.confirmation_token}`

  const content = `
    <p class="paragraph">Su extorno está listo para ser procesado. Por favor, confirme los datos:</p>
    
    <table class="detail-table">
      <tr class="detail-row">
        <td class="detail-label">ID Extorno</td>
        <td class="detail-value">#${extorno.id}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Matrícula</td>
        <td class="detail-value" style="font-family: monospace; font-weight: bold;">${extorno.matricula}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Cliente</td>
        <td class="detail-value">${extorno.cliente}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Importe</td>
        <td class="detail-value"><span class="amount">${extorno.importe.toFixed(2)} €</span></td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Motivo</td>
        <td class="detail-value">${extorno.motivo}</td>
      </tr>
    </table>

    <div class="warning-box">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ Acción requerida:</strong> Debe confirmar este extorno para proceder con el pago.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="display: inline-block; background-color: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Confirmar Extorno
      </a>
    </div>

    <div class="info-box">
      <p style="margin: 0;"><strong>🔗 Enlace alternativo:</strong><br>
      Si el botón no funciona, copie y pegue este enlace en su navegador:<br>
      <a href="${confirmUrl}" style="color: #0066cc; word-break: break-all;">${confirmUrl}</a></p>
    </div>
  `

  return getExtornoEmailTemplate(content, "Confirmar Extorno")
}

export function generateRechazoEmailHTML(extorno: ExtornoData): string {
  const content = `
    <p class="paragraph">Lamentamos informarle que su solicitud de extorno ha sido rechazada:</p>
    
    <table class="detail-table">
      <tr class="detail-row">
        <td class="detail-label">ID Extorno</td>
        <td class="detail-value">#${extorno.id}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Matrícula</td>
        <td class="detail-value" style="font-family: monospace; font-weight: bold;">${extorno.matricula}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Cliente</td>
        <td class="detail-value">${extorno.cliente}</td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Importe</td>
        <td class="detail-value"><span class="amount">${extorno.importe.toFixed(2)} €</span></td>
      </tr>
      <tr class="detail-row">
        <td class="detail-label">Estado</td>
        <td class="detail-value"><span class="status status-${extorno.estado.toLowerCase()}">${extorno.estado}</span></td>
      </tr>
      ${
        extorno.observaciones
          ? `
      <tr class="detail-row">
        <td class="detail-label">Motivo del rechazo</td>
        <td class="detail-value">${extorno.observaciones}</td>
      </tr>
      `
          : ""
      }
    </table>

    <div class="error-box">
      <p style="margin: 0; color: #991b1b;"><strong>❌ Solicitud rechazada:</strong> Para más información, contacte con su asesor comercial.</p>
    </div>
  `

  return getExtornoEmailTemplate(content, "Extorno Rechazado")
}

export function generateExtornoEmailHTML(extorno: ExtornoData): string {
  return generateRegistroEmailHTML(extorno)
}
