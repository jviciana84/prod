"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Vehicle {
  id: number
  license_plate: string
  model: string
  paint_status: string
  assigned_to: string | null
  photos_completed: boolean
  photos_completed_date: string | null
  created_at: string
  assigned_user?: {
    id: string
    email: string
    full_name: string | null
  } | null
  photographer?:
    | {
        id: number
        user_id: string
        display_name: string
        percentage: number
      }[]
    | null
}

interface PrintExportButtonProps {
  vehicles: Vehicle[]
  searchQuery: string
  statusFilter: string
  photographerFilter: string
  photographers: Array<{
    id: number
    user_id: string
    display_name: string
    percentage: number
  }>
}

export function PrintExportButton({ 
  vehicles, 
  searchQuery, 
  statusFilter, 
  photographerFilter,
  photographers 
}: PrintExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = (data: Vehicle[]) => {
    // Definir las columnas que se van a exportar
    const columns = [
      { key: 'license_plate', label: 'Matrícula' },
      { key: 'model', label: 'Modelo' },
      { key: 'paint_status', label: 'Estado Pintura' },
      { key: 'assigned_to', label: 'Asignado' },
      { key: 'photos_completed', label: 'Fotografiado' },
      { key: 'photos_completed_date', label: 'Fecha Fotografía' },
      { key: 'created_at', label: 'Fecha Creación' },
      { key: 'days_pending', label: 'Días Pendiente' }
    ]

    // Crear el encabezado CSV
    const header = columns.map(col => col.label).join(',')

    // Crear las filas CSV
    const rows = data.map(vehicle => {
      // Obtener el nombre del fotógrafo asignado
      const getAssignedPhotographerName = (vehicle: Vehicle) => {
        if (!vehicle.assigned_to) return "Sin asignar"

        if (vehicle.photographer && vehicle.photographer.length > 0) {
          const photographer = vehicle.photographer.find((p) => p.user_id === vehicle.assigned_to)
          if (photographer && photographer.display_name) {
            return photographer.display_name
          }
        }

        if (vehicle.assigned_user) {
          return vehicle.assigned_user.full_name || vehicle.assigned_user.email
        }

        return vehicle.assigned_to
      }

      // Calcular días pendientes
      const calculatePendingDays = (vehicle: Vehicle) => {
        if (!vehicle.created_at) return 0

        const creationDate = new Date(vehicle.created_at)
        const today = new Date()

        if (vehicle.photos_completed && vehicle.photos_completed_date) {
          const completionDate = new Date(vehicle.photos_completed_date)
          return Math.floor((completionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
        } else {
          return Math.floor((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
        }
      }

      return columns.map(col => {
        let value: any = vehicle[col.key as keyof Vehicle]
        
        // Formatear valores especiales
        if (col.key === 'assigned_to') {
          value = getAssignedPhotographerName(vehicle)
        } else if (col.key === 'photos_completed') {
          value = value ? 'Sí' : 'No'
        } else if (col.key === 'photos_completed_date' && value) {
          value = new Date(value).toLocaleDateString('es-ES')
        } else if (col.key === 'created_at' && value) {
          value = new Date(value).toLocaleDateString('es-ES')
        } else if (col.key === 'days_pending') {
          value = calculatePendingDays(vehicle)
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

  const generatePDF = async (data: Vehicle[]) => {
    try {
      // Crear el contenido HTML para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte de Vehículos - Gestión de Fotos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .filters { margin-bottom: 20px; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-completed { background-color: #d4edda; }
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
            <h1>Reporte de Vehículos - Gestión de Fotos</h1>
            <p>Total: ${data.length} vehículos</p>
            <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <div class="filters">
            <strong>Filtros aplicados:</strong><br>
            ${searchQuery ? `Búsqueda: "${searchQuery}"<br>` : ''}
            Estado: ${statusFilter === 'all' ? 'Todos' : statusFilter === 'completed' ? 'Fotografiados' : 'Pendientes'}<br>
            Fotógrafo: ${photographerFilter === 'all' ? 'Todos' : photographerFilter === 'null' ? 'Sin asignar' : photographers.find(p => p.user_id === photographerFilter)?.display_name || photographerFilter}
          </div>

          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Modelo</th>
                <th>Estado Pintura</th>
                <th>Asignado</th>
                <th>Fotografiado</th>
                <th>Fecha Fotografía</th>
                <th>Días Pendiente</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((vehicle, index) => {
                // Obtener el nombre del fotógrafo asignado
                const getAssignedPhotographerName = (vehicle: Vehicle) => {
                  if (!vehicle.assigned_to) return "Sin asignar"

                  if (vehicle.photographer && vehicle.photographer.length > 0) {
                    const photographer = vehicle.photographer.find((p) => p.user_id === vehicle.assigned_to)
                    if (photographer && photographer.display_name) {
                      return photographer.display_name
                    }
                  }

                  if (vehicle.assigned_user) {
                    return vehicle.assigned_user.full_name || vehicle.assigned_user.email
                  }

                  return vehicle.assigned_to
                }

                // Calcular días pendientes
                const calculatePendingDays = (vehicle: Vehicle) => {
                  if (!vehicle.created_at) return 0

                  const creationDate = new Date(vehicle.created_at)
                  const today = new Date()

                  if (vehicle.photos_completed && vehicle.photos_completed_date) {
                    const completionDate = new Date(vehicle.photos_completed_date)
                    return Math.floor((completionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
                  } else {
                    return Math.floor((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
                  }
                }

                const pendingDays = calculatePendingDays(vehicle)
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
                  <td>${vehicle.license_plate || ''}</td>
                  <td>${vehicle.model || ''}</td>
                  <td>${vehicle.paint_status || 'pendiente'}</td>
                  <td>${getAssignedPhotographerName(vehicle)}</td>
                  <td class="${vehicle.photos_completed ? 'status-completed' : 'status-pending'}">${vehicle.photos_completed ? 'Sí' : 'No'}</td>
                  <td>${vehicle.photos_completed_date ? new Date(vehicle.photos_completed_date).toLocaleDateString('es-ES') : ''}</td>
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
    if (vehicles.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    setIsExporting(true)
    try {
      if (type === 'excel') {
        const csv = generateCSV(vehicles)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `fotos_vehiculos_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Archivo Excel descargado correctamente')
      } else {
        await generatePDF(vehicles)
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