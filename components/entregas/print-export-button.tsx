"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { Entrega } from "@/types/entregas"

interface PrintExportButtonProps {
  entregas: Entrega[]
  activeTab: string
  searchQuery: string
  dateFilter: { from: Date | undefined; to: Date | undefined }
}

export function PrintExportButton({ 
  entregas, 
  activeTab, 
  searchQuery, 
  dateFilter 
}: PrintExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = (data: Entrega[]) => {
    // Definir las columnas que se van a exportar
    const columns = [
      { key: 'matricula', label: 'Matrícula' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'asesor', label: 'Asesor' },
      { key: 'or', label: 'OR' },
      { key: 'fecha_venta', label: 'Fecha Venta' },
      { key: 'fecha_entrega', label: 'Fecha Entrega' },
      { key: 'incidencia', label: 'Incidencia' },
      { key: 'tipos_incidencia', label: 'Tipos Incidencia' },
      { key: 'observaciones', label: 'Observaciones' },
      { key: 'enviado_a_incentivos', label: 'Enviado a Incentivos' },
      { key: 'email_enviado', label: 'Email Enviado' },
      { key: 'email_enviado_at', label: 'Email Enviado At' }
    ]

    // Crear el encabezado CSV
    const header = columns.map(col => col.label).join(',')

    // Crear las filas CSV
    const rows = data.map(entrega => {
      return columns.map(col => {
        let value = entrega[col.key as keyof Entrega]
        
        // Formatear valores especiales
        if (col.key === 'incidencia') {
          value = value ? 'Sí' : 'No'
        } else if (col.key === 'enviado_a_incentivos') {
          value = value ? 'Sí' : 'No'
        } else if (col.key === 'email_enviado') {
          value = value ? 'Sí' : 'No'
        } else if (col.key === 'tipos_incidencia') {
          value = Array.isArray(value) ? value.join('; ') : ''
        } else if (col.key === 'fecha_venta' && value) {
          value = new Date(value).toLocaleDateString('es-ES')
        } else if (col.key === 'fecha_entrega' && value) {
          value = new Date(value).toLocaleDateString('es-ES')
        } else if (col.key === 'email_enviado_at' && value) {
          value = new Date(value).toLocaleDateString('es-ES')
        }
        
        // Escapar comas y comillas en el valor
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        
        return value || ''
      }).join(',')
    })

    return `${header}\n${rows.join('\n')}`
  }

  const generatePDF = async (data: Entrega[]) => {
    try {
      // Crear el contenido HTML para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte de Entregas - ${activeTab}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .filters { margin-bottom: 20px; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-incidencia { background-color: #f8d7da; }
            .status-sin-incidencia { background-color: #d4edda; }
            .row-even { background-color: #e8e8e8; }
            .row-odd { background-color: #ffffff; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Entregas</h1>
            <p>Pestaña: ${activeTab} | Total: ${data.length} entregas</p>
            <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <div class="filters">
            <strong>Filtros aplicados:</strong><br>
            ${searchQuery ? `Búsqueda: "${searchQuery}"<br>` : ''}
            ${dateFilter.from || dateFilter.to ? 
              `Rango de fechas: ${dateFilter.from ? dateFilter.from.toLocaleDateString('es-ES') : 'Sin inicio'} - ${dateFilter.to ? dateFilter.to.toLocaleDateString('es-ES') : 'Sin fin'}<br>` : 
              ''
            }
          </div>

          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Modelo</th>
                <th>Asesor</th>
                <th>OR</th>
                <th>Fecha Venta</th>
                <th>Fecha Entrega</th>
                <th>Incidencia</th>
                <th>Tipos Incidencia</th>
                <th>Observaciones</th>
                <th>Enviado a Incentivos</th>
                <th>Email Enviado</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((entrega, index) => `
                <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
                  <td>${entrega.matricula || ''}</td>
                  <td>${entrega.modelo || ''}</td>
                  <td>${entrega.asesor || ''}</td>
                  <td>${entrega.or || ''}</td>
                  <td>${entrega.fecha_venta ? new Date(entrega.fecha_venta).toLocaleDateString('es-ES') : ''}</td>
                  <td>${entrega.fecha_entrega ? new Date(entrega.fecha_entrega).toLocaleDateString('es-ES') : ''}</td>
                  <td class="${entrega.incidencia ? 'status-incidencia' : 'status-sin-incidencia'}">${entrega.incidencia ? 'Sí' : 'No'}</td>
                  <td>${Array.isArray(entrega.tipos_incidencia) ? entrega.tipos_incidencia.join(', ') : ''}</td>
                  <td>${entrega.observaciones || ''}</td>
                  <td>${entrega.enviado_a_incentivos ? 'Sí' : 'No'}</td>
                  <td>${entrega.email_enviado ? 'Sí' : 'No'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

      // Crear un blob con el contenido HTML
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)

      // Abrir en una nueva ventana para imprimir
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.document.close()
        printWindow.focus()
        // Esperar un poco para que se cargue el contenido
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }

      // Limpiar el URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(url), 1000)

    } catch (error) {
      console.error('Error generando PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (entregas.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    setIsExporting(true)
    try {
      if (type === 'excel') {
        const csv = generateCSV(entregas)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `entregas_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Archivo Excel descargado correctamente')
      } else {
        await generatePDF(entregas)
        toast.success('PDF generado correctamente')
      }
    } catch (error) {
      console.error('Error en la exportación:', error)
      toast.error('Error al exportar los datos')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        className="h-9 w-9"
        title="Imprimir PDF"
      >
        <Printer className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleExport('excel')}
        disabled={isExporting}
        className="h-9 w-9"
        title="Exportar Excel"
      >
        <FileSpreadsheet className="h-4 w-4" />
      </Button>
    </div>
  )
}

