import { getMovementEmailTemplate } from "./email-styles"

interface MovementData {
  fecha: string
  usuario_entrega: string
  email_entrega: string | null
  movimientos: Array<{
    usuario_recibe: string
    email_recibe: string | null
    items: Array<{
      matricula: string
      material: string
      observaciones?: string
    }>
  }>
}

export function generateMovementEmailHTML(movementData: MovementData): string {
  // Generar lista de materiales por usuario
  let materialesHTML = ""

  movementData.movimientos.forEach((movimiento) => {
    materialesHTML += `
      <div style="margin-bottom: 25px;">
        <div class="section-header">${movimiento.usuario_recibe}</div>
        <table class="table">
          <thead>
            <tr>
              <th class="table-header">Matrícula</th>
              <th class="table-header">Material</th>
              <th class="table-header">Observaciones</th>
            </tr>
          </thead>
          <tbody>
    `

    movimiento.items.forEach((item) => {
      materialesHTML += `
            <tr>
              <td class="table-cell">${item.matricula}</td>
              <td class="table-cell">${item.material}</td>
              <td class="table-cell" style="color: #6b7280;">${item.observaciones || ""}</td>
            </tr>
      `
    })

    materialesHTML += `
          </tbody>
        </table>
      </div>
    `
  })

  const content = `
    <p class="paragraph">Estimados compañeros,</p>
    
    <p class="paragraph"><strong>${movementData.usuario_entrega}</strong> el <strong>${movementData.fecha}</strong> ha realizado las siguientes entregas de material:</p>

    ${materialesHTML}

    <div class="info-box">
      <h3 style="margin-top: 0; color: #1e40af;">¿Cómo confirmar o rechazar la recepción?</h3>
      <ol>
        <li>Accede al <strong>Dashboard del Sistema CVO</strong></li>
        <li>Ve a la sección <strong>"MOVIMIENTOS PENDIENTES"</strong> en el menú principal</li>
        <li>Busca los movimientos correspondientes a tu nombre</li>
        <li>Haz clic en <strong>"Confirmar"</strong> si has recibido el material correctamente</li>
        <li>Haz clic en <strong>"Rechazar"</strong> si no has recibido el material o hay algún problema</li>
      </ol>
      <p><strong>Nota:</strong> También puedes acceder directamente desde el menú lateral del dashboard.</p>
    </div>

    <div class="warning-box">
      <p style="margin: 0; color: #92400e;"><strong>Importante:</strong> Recordamos que disponen de <strong>24 horas laborables</strong> para confirmar o rechazar la recepción del material. Transcurrido este plazo, se considerará automáticamente aceptado.</p>
    </div>

    <div style="margin-top: 30px; font-size: 16px;">
      Atentamente,<br>
      <strong>Sistema de Gestión de Material - CVO</strong>
    </div>
  `

  return getMovementEmailTemplate(content)
}
