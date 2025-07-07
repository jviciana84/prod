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
  rechazado_por_nombre?: string
  rechazado_por_id?: string
  motivo_rechazo?: string
  created_at?: string
  tramitado_por_nombre?: string
  tramitado_por_id?: string
  fecha_tramitacion?: string
}

// Función para formatear fecha en DD/MM/AAAA
function formatFechaDMY(fecha: string | undefined): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function generateRegistroEmailHTML(extorno: ExtornoData, tablaAdjuntosHtml: string = ""): string {
  let clienteTexto = extorno.cliente || ''
  if (extorno.numero_cliente) {
    clienteTexto += ` <b>CL. (${extorno.numero_cliente})</b>`
  }

  let concesionTexto = ''
  if (String(extorno.concesion) === '1') {
    concesionTexto = 'Motor Munich SA'
  } else if (String(extorno.concesion) === '2') {
    concesionTexto = 'Motor Munich Cadí SL'
  } else {
    concesionTexto = extorno.concesion ? String(extorno.concesion) : ''
  }

  const filas = [
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;width:180px;'>Matrícula</td><td style='padding:8px 12px;'>${extorno.matricula}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Cliente</td><td style='padding:8px 12px;'>${clienteTexto}</td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Concepto</td><td style='padding:8px 12px;'>${extorno.motivo || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Importe</td><td style='padding:8px 12px;'><strong>${Number(extorno.importe).toLocaleString('es-ES', {minimumFractionDigits:2})} €</strong></td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Número de Cuenta</td><td style='padding:8px 12px;font-family:monospace;'>${extorno.numero_cuenta || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Concesión</td><td style='padding:8px 12px;'>${concesionTexto}</td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Fecha</td><td style='padding:8px 12px;'>${formatFechaDMY(extorno.fecha_solicitud || extorno.created_at || '')}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Registrado por</td><td style='padding:8px 12px;'>${extorno.registrado_por_nombre} <i>(${extorno.registrado_por_id})</i></td></tr>`
  ]

  const content = `
    <div style="background:#FFB300;color:#fff;padding:40px 0;text-align:center;border-radius:12px 12px 0 0;font-size:1.7em;font-weight:bold;letter-spacing:0.5px;margin-bottom:0;width:100%;">NUEVA SOLICITUD DE EXTORNO</div>
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
  let clienteTexto = extorno.cliente || ''
  if (extorno.numero_cliente) {
    clienteTexto += ` <b>CL. (${extorno.numero_cliente})</b>`
  }

  let concesionTexto = ''
  if (String(extorno.concesion) === '1') {
    concesionTexto = 'Motor Munich SA'
  } else if (String(extorno.concesion) === '2') {
    concesionTexto = 'Motor Munich Cadí SL'
  } else {
    concesionTexto = extorno.concesion ? String(extorno.concesion) : ''
  }

  const filas = [
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;width:180px;'>Matrícula</td><td style='padding:8px 12px;'>${extorno.matricula}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Cliente</td><td style='padding:8px 12px;'>${clienteTexto}</td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Concepto</td><td style='padding:8px 12px;'>${extorno.motivo || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Importe</td><td style='padding:8px 12px;'><strong>${Number(extorno.importe).toLocaleString('es-ES', {minimumFractionDigits:2})} €</strong></td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Número de Cuenta</td><td style='padding:8px 12px;font-family:monospace;'>${extorno.numero_cuenta || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Concesión</td><td style='padding:8px 12px;'>${concesionTexto}</td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Fecha</td><td style='padding:8px 12px;'>${formatFechaDMY(extorno.fecha_solicitud || extorno.created_at || '')}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Registrado por</td><td style='padding:8px 12px;'>${extorno.registrado_por_nombre} <i>(${extorno.registrado_por_id})</i></td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Tramitado por</td><td style='padding:8px 12px;'>${extorno.tramitado_por_nombre || extorno.tramitado_por_id || 'Usuario desconocido'}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Fecha tramitación</td><td style='padding:8px 12px;'>${formatFechaDMY(extorno.fecha_tramitacion || '')}</td></tr>`
  ]

  // URL para confirmar el pago
  const confirmPaymentUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/extornos/confirmacion?token=${extorno.confirmation_token}`

  const content = `
    <div style="background:#22C55E;color:#fff;padding:40px 0;text-align:center;border-radius:12px 12px 0 0;font-size:1.7em;font-weight:bold;letter-spacing:0.5px;margin-bottom:0;width:100%;">EXTORNO TRAMITADO</div>
    <p style="margin-bottom: 16px;">Estimados compañeros,</p>
    <p style="margin-bottom: 24px;">El siguiente extorno ha sido tramitado y está listo para confirmación:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr style="background:#22C55E;color:#fff;">
        <th colspan="2" style="padding:10px 12px;text-align:left;font-size:1.1em;">EXTORNO TRAMITADO</th>
      </tr>
      ${filas.join('\n')}
    </table>
    <div style='margin:24px 0 0 0;padding:18px 20px;background:#f0fdf4;color:#166534;border:1px solid #22c55e;border-radius:8px;font-size:1.1em;'>
      <b>Estado:</b> El extorno ha sido revisado y tramitado correctamente. Está pendiente de confirmación de pago.
      <div style="text-align: center; margin: 20px 0 10px 0;">
        <a href="${confirmPaymentUrl}" style="display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; border: 2px solid #166534;">
          ✅ Confirmar Pago Realizado
        </a>
      </div>
      <div style="text-align: center; margin-top: 10px; font-size: 0.9em;">
        <strong>🔗 Enlace alternativo:</strong><br>
        Si el botón no funciona, copie y pegue este enlace en su navegador:<br>
        <a href="${confirmPaymentUrl}" style="color: #166534; word-break: break-all;">${confirmPaymentUrl}</a>
      </div>
    </div>
  `

  return getExtornoEmailTemplate(content, "Extorno Tramitado")
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
  let clienteTexto = extorno.cliente || ''
  if (extorno.numero_cliente) {
    clienteTexto += ` <b>CL. (${extorno.numero_cliente})</b>`
  }

  let concesionTexto = ''
  if (String(extorno.concesion) === '1') {
    concesionTexto = 'Motor Munich SA'
  } else if (String(extorno.concesion) === '2') {
    concesionTexto = 'Motor Munich Cadí SL'
  } else {
    concesionTexto = extorno.concesion ? String(extorno.concesion) : ''
  }

  const filas = [
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;width:180px;'>Matrícula</td><td style='padding:8px 12px;'>${extorno.matricula}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Cliente</td><td style='padding:8px 12px;'>${clienteTexto}</td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Concepto</td><td style='padding:8px 12px;'>${extorno.motivo || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Importe</td><td style='padding:8px 12px;'><strong>${Number(extorno.importe).toLocaleString('es-ES', {minimumFractionDigits:2})} €</strong></td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Número de Cuenta</td><td style='padding:8px 12px;font-family:monospace;'>${extorno.numero_cuenta || ''}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Concesión</td><td style='padding:8px 12px;'>${concesionTexto}</td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Fecha</td><td style='padding:8px 12px;'>${formatFechaDMY(extorno.fecha_solicitud || (extorno as any).created_at || '')}</td></tr>`,
    `<tr><td style='padding:8px 12px;font-weight:bold;'>Registrado por</td><td style='padding:8px 12px;'>${extorno.registrado_por_nombre} <i>(${extorno.registrado_por_id})</i></td></tr>`,
    `<tr style='background:#f7f7f7;'><td style='padding:8px 12px;font-weight:bold;'>Rechazado por</td><td style='padding:8px 12px;'>${extorno.rechazado_por_nombre || extorno.rechazado_por_id || ''}</td></tr>`
  ]

  const content = `
    <div style="background:#E53935;color:#fff;padding:40px 0;text-align:center;border-radius:12px 12px 0 0;font-size:1.7em;font-weight:bold;letter-spacing:0.5px;margin-bottom:0;width:100%;">EXTORNO RECHAZADO</div>
    <p style="margin-bottom: 16px;">Estimados compañeros,</p>
    <p style="margin-bottom: 24px;"><strong>${extorno.rechazado_por_nombre || extorno.rechazado_por_id || ''}</strong> ha rechazado el siguiente extorno:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr style="background:#E53935;color:#fff;">
        <th colspan="2" style="padding:10px 12px;text-align:left;font-size:1.1em;">EXTORNO RECHAZADO</th>
      </tr>
      ${filas.join('\n')}
    </table>
    <div style='margin:24px 0 0 0;padding:18px 20px;background:#ffebee;color:#b71c1c;border:1px solid #e53935;border-radius:8px;font-size:1.1em;'>
      <b>Motivo del rechazo:</b><br/>
      ${extorno.motivo_rechazo || 'Sin comentario'}
    </div>
  `

  return getExtornoEmailTemplate(content, "Extorno Rechazado")
}

export function generateExtornoEmailHTML(extorno: ExtornoData): string {
  return generateRegistroEmailHTML(extorno)
}
