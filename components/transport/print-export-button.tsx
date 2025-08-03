"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { CheckRemovedVehiclesButton } from "@/components/ui/check-removed-vehicles-button"

interface Transport {
  id: string
  license_plate: string
  model: string
  purchase_date: string
  origin_location?: {
    name: string
  } | null
  expense_type?: {
    name: string
  } | null
  is_received: boolean
  reception_date: string | null
  created_at: string
  updated_at: string
}

interface PrintExportButtonProps {
  transports: Transport[]
  searchQuery: string
  statusFilter: string
  locationFilter: string
  locations: Array<{
    id: string
    name: string
  }>
  // Datos que se están mostrando actualmente (con filtros y paginación aplicados)
  currentDisplayData: Transport[]
}

export function PrintExportButton({ 
  transports, 
  searchQuery, 
  statusFilter, 
  locationFilter,
  locations,
  currentDisplayData
}: PrintExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = (data: Transport[]) => {
    // Definir las columnas que se van a exportar
    const columns = [
      { key: 'license_plate', label: 'Matrícula' },
      { key: 'model', label: 'Modelo' },
      { key: 'purchase_date', label: 'Fecha Compra' },
      { key: 'origin_location', label: 'Origen' },
      { key: 'expense_type', label: 'Tipo Gasto' },
      { key: 'is_received', label: 'Recibido' },
      { key: 'reception_date', label: 'Fecha Recepción' },
      { key: 'created_at', label: 'Fecha Creación' },
      { key: 'days_pending', label: 'Días Pendiente' }
    ]

    // Crear el encabezado CSV
    const header = columns.map(col => col.label).join(',')

    // Crear las filas CSV
    const rows = data.map(transport => {
      // Calcular días pendientes
      const calculatePendingDays = (transport: Transport) => {
        if (!transport.created_at) return 0

        const creationDate = new Date(transport.created_at)
        const today = new Date()

        if (transport.is_received && transport.reception_date) {
          const receptionDate = new Date(transport.reception_date)
          return Math.floor((receptionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
        } else {
          return Math.floor((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
        }
      }

      return columns.map(col => {
        let value: any = transport[col.key as keyof Transport]
        
        // Formatear valores especiales
        if (col.key === 'origin_location') {
          value = transport.origin_location?.name || 'Sin origen'
        } else if (col.key === 'expense_type') {
          value = transport.expense_type?.name || 'Sin tipo'
        } else if (col.key === 'is_received') {
          value = value ? 'Sí' : 'No'
        } else if (col.key === 'purchase_date' && value) {
          value = new Date(value).toLocaleDateString('es-ES')
        } else if (col.key === 'reception_date' && value) {
          value = new Date(value).toLocaleDateString('es-ES')
        } else if (col.key === 'created_at' && value) {
          value = new Date(value).toLocaleDateString('es-ES')
        } else if (col.key === 'days_pending') {
          value = calculatePendingDays(transport)
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

  const generatePDF = async (data: Transport[]) => {
    try {
      // Crear el contenido HTML para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte de Nuevas Entradas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .filters { margin-bottom: 20px; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-received { background-color: #d4edda; }
            .status-pending { background-color: #fff3cd; }
            .row-even { background-color: #e8e8e8; }
            .row-odd { background-color: #ffffff; }
            .page-break { page-break-before: always; }
            .badge { padding: 2px 6px; border-radius: 3px; font-size: 9px; }
            .badge-green { background-color: #d4edda; color: #155724; }
            .badge-amber { background-color: #fff3cd; color: #856404; }
            .badge-red { background-color: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Nuevas Entradas</h1>
            <p>Total: ${data.length} vehículos</p>
            <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <div class="filters">
            <strong>Filtros aplicados:</strong><br>
            ${searchQuery ? `Búsqueda: "${searchQuery}"<br>` : ''}
            Estado: ${statusFilter === 'all' ? 'Todos' : statusFilter === 'received' ? 'Recibidos' : 'Pendientes'}<br>
            Origen: ${locationFilter === 'all' ? 'Todos' : locations.find(l => l.id === locationFilter)?.name || locationFilter}
          </div>

          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Modelo</th>
                <th>Fecha Compra</th>
                <th>Origen</th>
                <th>Tipo Gasto</th>
                <th>Recibido</th>
                <th>Fecha Recepción</th>
                <th>Días Pendiente</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((transport, index) => {
                // Calcular días pendientes
                const calculatePendingDays = (transport: Transport) => {
                  if (!transport.created_at) return 0

                  const creationDate = new Date(transport.created_at)
                  const today = new Date()

                  if (transport.is_received && transport.reception_date) {
                    const receptionDate = new Date(transport.reception_date)
                    return Math.floor((receptionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
                  } else {
                    return Math.floor((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
                  }
                }

                const pendingDays = calculatePendingDays(transport)
                let badgeClass = ''
                if (pendingDays <= 3) {
                  badgeClass = 'badge-green'
                } else if (pendingDays <= 7) {
                  badgeClass = 'badge-amber'
                } else {
                  badgeClass = 'badge-red'
                }

                return `
                <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
                  <td>${transport.license_plate || ''}</td>
                  <td>${transport.model || ''}</td>
                  <td>${transport.purchase_date ? new Date(transport.purchase_date).toLocaleDateString('es-ES') : ''}</td>
                  <td>${transport.origin_location?.name || 'Sin origen'}</td>
                  <td>${transport.expense_type?.name || 'Sin tipo'}</td>
                  <td class="${transport.is_received ? 'status-received' : 'status-pending'}">${transport.is_received ? 'Sí' : 'No'}</td>
                  <td>${transport.reception_date ? new Date(transport.reception_date).toLocaleDateString('es-ES') : ''}</td>
                  <td><span class="badge ${badgeClass}">${pendingDays}</span></td>
                </tr>
              `}).join('')}
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
    if (currentDisplayData.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    setIsExporting(true)
    try {
      if (type === 'excel') {
        const csv = generateCSV(currentDisplayData)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `nuevas_entradas_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Archivo Excel descargado correctamente')
      } else {
        await generatePDF(currentDisplayData)
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
      <CheckRemovedVehiclesButton variant="outline" size="icon" className="h-9 w-9" />
    </div>
  )
} 