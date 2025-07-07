export const EMAIL_STYLES = `
  body { 
    font-family: Arial, sans-serif; 
    background-color: #f5f5f5; 
    margin: 0; 
    padding: 20px 0; 
  }
  .container { 
    width: 100%; 
    max-width: 600px; 
    margin: 20px auto; 
    background-color: #ffffff; 
    border-collapse: collapse; 
    overflow: hidden; 
    box-shadow: 0 8px 24px rgba(0,0,0,0.12); 
    border-radius: 8px; 
  }
  .header {
    background-color: #3b82f6;
    padding: 40px 0;
    text-align: center;
    color: #fff;
    border-radius: 12px 12px 0 0;
    font-size: 1.7em;
    font-weight: bold;
    letter-spacing: 0.5px;
    margin-bottom: 0;
    width: 100%;
    text-transform: none;
    box-sizing: border-box;
  }
  .header-naranja {
    background-color: #FFB300;
    padding: 40px 0;
    text-align: center;
    color: #fff;
    border-radius: 12px 12px 0 0;
    font-size: 1.7em;
    font-weight: bold;
    letter-spacing: 0.5px;
    margin-bottom: 0;
    width: 100%;
    text-transform: none;
    box-sizing: border-box;
  }
  .header-title { 
    color: #ffffff; 
    font-size: 28px; 
    font-weight: 700; 
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    letter-spacing: 0.5px;
  }
  .content { 
    padding: 30px 20px; 
    line-height: 1.6; 
    color: #374151; 
  }
  .footer { 
    background-color: #f9fafb; 
    padding: 20px; 
    text-align: center; 
    border-top: 1px solid #e5e7eb; 
  }
  .footer-text { 
    margin: 5px 0; 
    font-size: 12px; 
    color: #6b7280; 
  }
  .table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 15px 0; 
  }
  .table-header { 
    background-color: #f3f4f6; 
    padding: 12px; 
    text-align: left; 
    font-weight: 600; 
    border: 1px solid #d1d5db; 
  }
  .table-cell { 
    padding: 10px 12px; 
    border: 1px solid #e5e7eb; 
  }
  .paragraph { 
    margin: 15px 0; 
    font-size: 16px; 
    line-height: 1.5; 
  }
  .section-header {
    font-size: 18px; 
    font-weight: 600; 
    margin: 25px 0 15px 0; 
    color: #374151; 
    background-color: #f3f4f6; 
    padding: 12px; 
    border-radius: 6px;
  }
  .info-box {
    background-color: #eff6ff; 
    border: 1px solid #bfdbfe; 
    border-radius: 6px; 
    padding: 20px; 
    margin: 25px 0;
  }
  .warning-box {
    background-color: #fef3c7; 
    border: 1px solid #f59e0b; 
    border-radius: 6px; 
    padding: 20px; 
    margin: 25px 0;
  }
  .error-box {
    background-color: #fef2f2; 
    border: 1px solid #fecaca; 
    border-radius: 6px; 
    padding: 20px; 
    margin: 25px 0;
  }
  .success-box {
    background-color: #f0fdf4; 
    border: 1px solid #bbf7d0; 
    border-radius: 6px; 
    padding: 20px; 
    margin: 25px 0;
  }
  .detail-table {
    width: 100%; 
    border-collapse: collapse; 
    margin: 15px 0;
  }
  .detail-row {
    border-bottom: 1px solid #e5e7eb;
  }
  .detail-label {
    padding: 10px 12px; 
    background-color: #f9fafb; 
    font-weight: 600; 
    width: 30%; 
    border: 1px solid #e5e7eb;
  }
  .detail-value {
    padding: 10px 12px; 
    border: 1px solid #e5e7eb;
  }
  .amount {
    color: #059669; 
    font-weight: 600; 
    font-size: 18px;
  }
  .status {
    padding: 4px 8px; 
    border-radius: 4px; 
    font-size: 12px; 
    font-weight: 600; 
    text-transform: uppercase;
  }
  .status-pendiente {
    background-color: #fef3c7; 
    color: #92400e;
  }
  .status-tramitado {
    background-color: #dbeafe; 
    color: #1e40af;
  }
  .status-realizado {
    background-color: #dcfce7; 
    color: #166534;
  }
  .status-rechazado {
    background-color: #fecaca; 
    color: #991b1b;
  }
`

export function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notificación - CVO</title>
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <table class="container" role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td class="content">
            ${content}
          </td>
        </tr>
        <tr>
          <td class="footer">
            <p class="footer-text">Sistema de Gestión - CVO</p>
            <p class="footer-text">Este es un mensaje automático, por favor no responda a este email</p>
            <p class="footer-text">&copy; 2025 CVO. Todos los derechos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getEntregaEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notificación de Entrega - CVO</title>
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <table class="container" role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td class="header">
            <h1 class="header-title">Notificación de Entrega de Vehículo</h1>
          </td>
        </tr>
        <tr>
          <td class="content">
            ${content}
          </td>
        </tr>
        <tr>
          <td class="footer">
            <p class="footer-text">Sistema de Gestión - CVO</p>
            <p class="footer-text">Este es un mensaje automático, por favor no responda a este email</p>
            <p class="footer-text">&copy; 2025 CVO. Todos los derechos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getMovementEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notificación de Movimiento - CVO</title>
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <table class="container" role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td class="header">
            <h1 class="header-title">Notificación de Entrega de Material</h1>
          </td>
        </tr>
        <tr>
          <td class="content">
            ${content}
          </td>
        </tr>
        <tr>
          <td class="footer">
            <p class="footer-text">Sistema de Gestión - CVO</p>
            <p class="footer-text">Este es un mensaje automático, por favor no responda a este email</p>
            <p class="footer-text">&copy; 2025 CVO. Todos los derechos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export function getExtornoEmailTemplate(content: string, title: string): string {
  // Pie de página global
  const globalFooter = `
    <div style="background:#f7f7f7;padding:24px 0 16px 0;text-align:center;color:#666;font-size:1em;border-radius:0 0 8px 8px;margin-top:32px;">
      Sistema de Gestión - CVO<br/>
      <span style="font-size:0.95em;">Este es un mensaje automático, por favor no responda a este email</span><br/>
      <span style="font-size:0.95em;">© 2025 CVO. Todos los derechos reservados.</span>
    </div>
  `;

  // Si el título es 'Nueva Solicitud de Extorno', no añadas el footer global
  const includeFooter = title !== 'Nueva Solicitud de Extorno';
  
  // Si el contenido ya incluye un header (como el email de rechazo), no añadas header adicional
  const hasOwnHeader = content.includes('background:#E53935') || content.includes('background:#FFB300') || content.includes('background:#22C55E') || content.includes('background:#10B981');

  // NO añadir header si el título es vacío o solo espacios
  const shouldShowHeader = title && title.trim().length > 0;
  const headerClass = title === 'Nueva Solicitud de Extorno' ? 'header-naranja' : 'header';
  const headerHtml = (!shouldShowHeader || hasOwnHeader) ? '' : `<div class="${headerClass}">${title}</div>`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - CVO</title>
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <table class="container" role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td class="content">
            <div class="email-container">
              ${headerHtml}
              <div class="email-content">${content}</div>
              ${includeFooter ? globalFooter : ''}
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getEmailStyles(): string {
  return EMAIL_STYLES
}

export function wrapEmailContent(content: string): string {
  return getEmailTemplate(content)
}
