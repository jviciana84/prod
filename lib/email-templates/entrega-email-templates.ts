import { formatDateForDisplay } from "@/lib/date-utils"
import { getEntregaEmailTemplate } from "./email-styles"

interface EntregaData {
  id: string
  fecha_venta?: string | null
  fecha_entrega?: string | null
  matricula: string
  modelo?: string
  asesor?: string
  or?: string
  incidencia?: boolean
  tipos_incidencia?: string[]
  observaciones?: string
  enviado_a_incentivos?: boolean
  email_enviado?: boolean
  email_enviado_at?: string | null
}

export function generateEntregaEmailHTML(entrega: EntregaData, userName: string): string {
  const fechaEntrega = formatDateForDisplay(entrega.fecha_entrega)
  const tieneIncidencias = entrega.tipos_incidencia && entrega.tipos_incidencia.length > 0

  const tieneObservacionesReales =
    entrega.observaciones &&
    entrega.observaciones.trim() !== "" &&
    entrega.observaciones.trim() !== "Registro automático desde ventas"

  let incidenciasHTML = ""
  if (tieneIncidencias && entrega.tipos_incidencia) {
    incidenciasHTML = `
    <div class="error-box">
      <p style="margin: 0; color: #991b1b;"><strong>⚠️ Incidencias detectadas:</strong><br>
      ${entrega.tipos_incidencia.join(", ")}</p>
    </div>
  `
  }

  let observacionesHTML = ""
  if (tieneObservacionesReales) {
    observacionesHTML = `
    <div class="info-box">
      <h3 style="margin-top: 0; color: #1e40af;">📝 Observaciones:</h3>
      <p style="margin: 0;">${entrega.observaciones}</p>
    </div>
  `
  }

  const content = `
    <p class="paragraph">Estimados compañeros,</p>
    
    <p class="paragraph"><strong>${userName}</strong> ha registrado la entrega del vehículo el <strong>${fechaEntrega}</strong>:</p>

    <table class="table">
      <thead>
        <tr>
          <th class="table-header">Matrícula</th>
          <th class="table-header">Modelo</th>
          <th class="table-header">Asesor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="table-cell"><strong>${entrega.matricula}</strong></td>
          <td class="table-cell">${entrega.modelo || ""}</td>
          <td class="table-cell">${entrega.asesor || ""}</td>
        </tr>
      </tbody>
    </table>

    ${incidenciasHTML}

    ${observacionesHTML}

    <div style="margin-top: 30px; font-size: 16px;">
      Atentamente,<br>
      <strong>Sistema de Gestión de Entregas - CVO</strong>
    </div>
  `

  return getEntregaEmailTemplate(content)
}
