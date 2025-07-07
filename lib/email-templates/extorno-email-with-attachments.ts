// Función para generar enlaces a documentos en el email
export function generateDocumentLinksHTML(documentos: any[]) {
  if (!documentos || documentos.length === 0) {
    return ""
  }

  const documentosHTML = documentos
    .map(
      (doc) => `
    <tr style="background-color: #f8f9fa;">
      <td style="padding: 8px 12px; border: 1px solid #dee2e6;">
        ${getFileIcon(doc.tipo)} ${doc.nombre}
      </td>
      <td style="padding: 8px 12px; border: 1px solid #dee2e6;">
        ${formatFileSize(doc.tamaño)}
      </td>
      <td style="padding: 8px 12px; border: 1px solid #dee2e6;">
        <a href="${doc.url}" target="_blank" style="color: #007bff; text-decoration: none;">
          Ver documento
        </a>
      </td>
    </tr>
  `,
    )
    .join("")

  return `
    <div style="margin: 20px 0;">
      <div style="background-color: #17a2b8; color: white; padding: 12px; font-weight: bold; text-transform: uppercase; text-align: left; font-size: 14px; margin-bottom: 0;">
        DOCUMENTOS ADJUNTOS
      </div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #dee2e6;">
        <thead>
          <tr style="background-color: #e9ecef;">
            <th style="padding: 10px 12px; border: 1px solid #dee2e6; text-align: left;">Documento</th>
            <th style="padding: 10px 12px; border: 1px solid #dee2e6; text-align: left;">Tamaño</th>
            <th style="padding: 10px 12px; border: 1px solid #dee2e6; text-align: left;">Acción</th>
          </tr>
        </thead>
        <tbody>
          ${documentosHTML}
        </tbody>
      </table>
    </div>
  `
}

function getFileIcon(tipo: string) {
  if (tipo.includes("pdf")) return "📄"
  if (tipo.includes("image")) return "🖼️"
  if (tipo.includes("word") || tipo.includes("document")) return "📝"
  return "📎"
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
