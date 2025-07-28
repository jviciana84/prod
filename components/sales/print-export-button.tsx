"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet, Download } from "lucide-react"
import { toast } from "sonner"
import { SoldVehicle } from "./sales-table"

interface PrintExportButtonProps {
  vehicles: SoldVehicle[]
  activeTab: string
  searchQuery: string
  dateFilter: { startDate: Date | null; endDate: Date | null }
  hiddenColumns: Record<string, boolean>
}

export function PrintExportButton({ 
  vehicles, 
  activeTab, 
  searchQuery, 
  dateFilter, 
  hiddenColumns 
}: PrintExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = (data: SoldVehicle[]) => {
    // Definir las columnas que se van a exportar
    const columns = [
      { key: 'license_plate', label: 'Matrícula' },
      { key: 'model', label: 'Modelo' },
      { key: 'client_name', label: 'Cliente' },
      { key: 'brand', label: 'Marca' },
      { key: 'vehicle_type', label: 'Tipo' },
      { key: 'dealership_code', label: 'Concesionario' },
      { key: 'price', label: 'Precio' },
      { key: 'sale_date', label: 'Fecha Venta' },
      { key: 'advisor', label: 'Asesor' },
      { key: 'or_value', label: 'OR' },
      { key: 'expense_charge', label: 'Gastos' },
      { key: 'payment_method', label: 'Forma Pago' },
      { key: 'bank', label: 'Banco' },
      { key: 'payment_status', label: 'Estado Pago' },
      { key: 'document_type', label: 'Tipo Doc.' },
      { key: 'client_dni', label: 'Nº Doc' },
      { key: 'cyp_status', label: 'CyP' },
      { key: 'photo_360_status', label: '360º' },
      { key: 'validated', label: 'Validado' },
      { key: 'delivery_center', label: 'Pre-entrega' },
      { key: 'external_provider', label: 'Proveedor Externo' },
      { key: 'client_email', label: 'Email Cliente' },
      { key: 'client_phone', label: 'Teléfono Cliente' },
      { key: 'client_address', label: 'Dirección Cliente' },
      { key: 'client_city', label: 'Ciudad Cliente' },
      { key: 'client_province', label: 'Provincia Cliente' },
      { key: 'client_postal_code', label: 'CP Cliente' },
      { key: 'vin', label: 'Bastidor' },
      { key: 'order_number', label: 'Nº Pedido' },
      { key: 'order_date', label: 'Fecha Pedido' },
      { key: 'discount', label: 'Descuento' },
      { key: 'portal_origin', label: 'Portal Origen' },
      { key: 'is_resale', label: 'Reventa' },
      { key: 'color', label: 'Color' },
      { key: 'mileage', label: 'Kilómetros' },
      { key: 'registration_date', label: '1ª Matriculación' },
      { key: 'cyp_date', label: 'Fecha CyP' },
      { key: 'photo_360_date', label: 'Fecha 360º' },
      { key: 'validation_date', label: 'Fecha Validación' },
      { key: 'created_at', label: 'Fecha Creación' },
      { key: 'updated_at', label: 'Fecha Actualización' }
    ]

    // Filtrar columnas según las columnas ocultas
    const visibleColumns = columns.filter(col => {
      if (col.key === 'price' && hiddenColumns.price) return false
      if (col.key === 'sale_date' && hiddenColumns.saleDate) return false
      if (col.key === 'payment_method' && hiddenColumns.paymentMethod) return false
      if (col.key === 'document_type' && hiddenColumns.documentType) return false
      if (col.key === 'brand' && hiddenColumns.brand) return false
      if (col.key === 'dealership_code' && hiddenColumns.dealershipCode) return false
      if (col.key === 'bank' && hiddenColumns.bank) return false
      if (col.key === 'client_dni' && hiddenColumns.clientDni) return false
      return true
    })

    // Crear el encabezado CSV
    const header = visibleColumns.map(col => col.label).join(',')

    // Crear las filas CSV
    const rows = data.map(vehicle => {
      return visibleColumns.map(col => {
        let value = vehicle[col.key as keyof SoldVehicle]
        
        // Formatear valores especiales
        if (col.key === 'price' && value) {
          value = `${value} €`
        } else if (col.key === 'validated') {
          value = value ? 'Sí' : 'No'
        } else if (col.key === 'vehicle_type') {
          value = value === 'Moto' ? 'Moto' : 'Coche'
        } else if (col.key === 'is_resale') {
          value = value ? 'Sí' : 'No'
        } else if (col.key === 'sale_date' || col.key === 'order_date' || 
                   col.key === 'cyp_date' || col.key === 'photo_360_date' || 
                   col.key === 'validation_date' || col.key === 'created_at' || 
                   col.key === 'updated_at' || col.key === 'registration_date') {
          if (value) {
            value = new Date(value).toLocaleDateString('es-ES')
          }
        } else if (col.key === 'mileage' && value) {
          value = `${value.toLocaleString('es-ES')} km`
        }

        // Escapar comillas y comas en el valor
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }

        return value || ''
      }).join(',')
    })

    return [header, ...rows].join('\n')
  }

  const generatePDF = async (data: SoldVehicle[]) => {
    try {
      // Crear el contenido HTML para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte de Ventas - ${activeTab}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .filters { margin-bottom: 20px; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-completed { background-color: #d4edda; }
            .status-pending { background-color: #fff3cd; }
            .status-process { background-color: #cce5ff; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Vehículos Vendidos</h1>
            <p>Pestaña: ${activeTab} | Total: ${data.length} vehículos</p>
            <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <div class="filters">
            <strong>Filtros aplicados:</strong><br>
            ${searchQuery ? `Búsqueda: "${searchQuery}"<br>` : ''}
            ${dateFilter.startDate || dateFilter.endDate ? 
              `Rango de fechas: ${dateFilter.startDate ? dateFilter.startDate.toLocaleDateString('es-ES') : 'Sin inicio'} - ${dateFilter.endDate ? dateFilter.endDate.toLocaleDateString('es-ES') : 'Sin fin'}<br>` : 
              ''
            }
            Columnas ocultas: ${Object.entries(hiddenColumns).filter(([_, hidden]) => hidden).map(([key, _]) => key).join(', ') || 'Ninguna'}
          </div>

          <table>
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Modelo</th>
                <th>Cliente</th>
                <th>Marca</th>
                <th>Tipo</th>
                <th>Concesionario</th>
                ${!hiddenColumns.price ? '<th>Precio</th>' : ''}
                ${!hiddenColumns.saleDate ? '<th>Fecha Venta</th>' : ''}
                <th>Asesor</th>
                <th>OR</th>
                <th>Gastos</th>
                ${!hiddenColumns.paymentMethod ? '<th>Forma Pago</th>' : ''}
                ${!hiddenColumns.bank ? '<th>Banco</th>' : ''}
                <th>Estado Pago</th>
                ${!hiddenColumns.documentType ? '<th>Tipo Doc.</th>' : ''}
                ${!hiddenColumns.clientDni ? '<th>Nº Doc</th>' : ''}
                <th>CyP</th>
                <th>360º</th>
                <th>Validado</th>
                <th>Pre-entrega</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(vehicle => `
                <tr>
                  <td>${vehicle.license_plate || ''}</td>
                  <td>${vehicle.model || ''}</td>
                  <td>${vehicle.client_name || ''}</td>
                  <td>${vehicle.brand || ''}</td>
                  <td>${vehicle.vehicle_type === 'Moto' ? 'Moto' : 'Coche'}</td>
                  <td>${vehicle.dealership_code || ''}</td>
                  ${!hiddenColumns.price ? `<td>${vehicle.price ? `${vehicle.price.toLocaleString('es-ES')} €` : ''}</td>` : ''}
                  ${!hiddenColumns.saleDate ? `<td>${vehicle.sale_date ? new Date(vehicle.sale_date).toLocaleDateString('es-ES') : ''}</td>` : ''}
                  <td>${vehicle.advisor || ''}</td>
                  <td>${vehicle.or_value || ''}</td>
                  <td>${vehicle.expense_charge || ''}</td>
                  ${!hiddenColumns.paymentMethod ? `<td>${vehicle.payment_method || ''}</td>` : ''}
                  ${!hiddenColumns.bank ? `<td>${vehicle.bank || ''}</td>` : ''}
                  <td>${vehicle.payment_status || ''}</td>
                  ${!hiddenColumns.documentType ? `<td>${vehicle.document_type || ''}</td>` : ''}
                  ${!hiddenColumns.clientDni ? `<td>${vehicle.client_dni || ''}</td>` : ''}
                  <td class="${vehicle.cyp_status === 'completado' ? 'status-completed' : vehicle.cyp_status === 'en_proceso' ? 'status-process' : 'status-pending'}">${vehicle.cyp_status || ''}</td>
                  <td class="${vehicle.photo_360_status === 'completado' ? 'status-completed' : vehicle.photo_360_status === 'en_proceso' ? 'status-process' : 'status-pending'}">${vehicle.photo_360_status || ''}</td>
                  <td>${vehicle.validated ? 'Sí' : 'No'}</td>
                  <td>${vehicle.delivery_center || ''}${vehicle.external_provider ? ` (${vehicle.external_provider})` : ''}</td>
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
        link.setAttribute('download', `ventas_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`)
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