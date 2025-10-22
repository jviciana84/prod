"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface BatteryVehicle {
  id: string
  vehicle_chassis: string
  vehicle_ecode: string | null
  vehicle_plate: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  vehicle_type: string
  charge_percentage: number
  status: "pendiente" | "revisado"
  status_date: string | null
  is_charging: boolean
  is_unavailable?: boolean
  observations: string | null
  is_sold?: boolean
}

interface BatteryControlPrintExportProps {
  vehicles: BatteryVehicle[]
  activeTab: string
  searchQuery: string
}

export function BatteryControlPrintExport({ vehicles, activeTab, searchQuery }: BatteryControlPrintExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = (data: BatteryVehicle[]) => {
    // Definir las columnas que se van a exportar
    const columns = [
      { key: "vehicle_brand", label: "Marca" },
      { key: "vehicle_chassis", label: "Chasis" },
      { key: "vehicle_ecode", label: "e-code" },
      { key: "vehicle_plate", label: "Matrícula" },
      { key: "vehicle_model", label: "Modelo" },
      { key: "vehicle_color", label: "Color" },
      { key: "vehicle_type", label: "Tipo" },
      { key: "charge_percentage", label: "% Carga" },
      { key: "charge_level", label: "Nivel" },
      { key: "status", label: "Estado" },
      { key: "status_date", label: "Fecha Revisión" },
      { key: "is_charging", label: "Cargando" },
      { key: "observations", label: "Observaciones" },
    ]

    // Crear el encabezado CSV
    const header = columns.map((col) => col.label).join(",")

    // Crear las filas CSV
    const rows = data.map((vehicle) => {
      return columns
        .map((col) => {
          let value: any = vehicle[col.key as keyof BatteryVehicle]

          // Formatear valores especiales
          if (col.key === "charge_percentage") {
            value = `${value}%`
          } else if (col.key === "charge_level") {
            // Determinar nivel basado en porcentaje y tipo
            const percentage = vehicle.charge_percentage
            if (vehicle.vehicle_type === "BEV") {
              if (percentage >= 80) value = "Correcto"
              else if (percentage >= 50) value = "Suficiente"
              else value = "Insuficiente"
            } else {
              if (percentage >= 70) value = "Correcto"
              else if (percentage >= 40) value = "Suficiente"
              else value = "Insuficiente"
            }
          } else if (col.key === "status") {
            if (vehicle.is_unavailable) {
              value = "No Disponible"
            } else {
              value = value === "revisado" ? "Revisado" : "Pendiente"
            }
          } else if (col.key === "status_date" && value) {
            value = format(new Date(value), "dd/MM/yyyy")
          } else if (col.key === "is_charging") {
            value = value ? "Sí" : "No"
          }

          // Escapar comas y comillas en el valor
          if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
            value = `"${value.replace(/"/g, '""')}"`
          }

          return value || ""
        })
        .join(",")
    })

    return `${header}\n${rows.join("\n")}`
  }

  const generatePDF = async (data: BatteryVehicle[]) => {
    try {
      // Crear el contenido HTML para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte Control de Baterías - ${activeTab}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .filters { margin-bottom: 20px; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .row-even { background-color: #e8e8e8; }
            .row-odd { background-color: #ffffff; }
            .status-revisado { background-color: #d4edda; color: #155724; }
            .status-pendiente { background-color: #f8d7da; color: #721c24; }
            .status-unavailable { background-color: #fff3cd; color: #856404; }
            .level-correcto { background-color: #d4edda; color: #155724; }
            .level-suficiente { background-color: #fff3cd; color: #856404; }
            .level-insuficiente { background-color: #f8d7da; color: #721c24; }
            .type-bev { background-color: #cfe2ff; color: #084298; font-weight: bold; }
            .type-phev { background-color: #d1e7dd; color: #0f5132; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Control de Baterías</h1>
            <p>Pestaña: ${activeTab} | Total: ${data.length} vehículos</p>
            <p>Fecha de generación: ${new Date().toLocaleDateString("es-ES")}</p>
          </div>
          
          <div class="filters">
            <strong>Filtros aplicados:</strong><br>
            ${searchQuery ? `Búsqueda: "${searchQuery}"<br>` : "Sin filtros de búsqueda"}
          </div>

          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th>Matrícula</th>
                <th>Modelo</th>
                <th>Tipo</th>
                <th>% Carga</th>
                <th>Nivel</th>
                <th>Estado</th>
                <th>Cargando</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map((vehicle, index) => {
                  // Determinar nivel
                  const percentage = vehicle.charge_percentage
                  let level = "Correcto"
                  let levelClass = "level-correcto"
                  
                  if (vehicle.vehicle_type === "BEV") {
                    if (percentage < 30) {
                      level = "Insuficiente"
                      levelClass = "level-insuficiente"
                    } else if (percentage < 80) {
                      level = "Suficiente"
                      levelClass = "level-suficiente"
                    }
                  } else {
                    if (percentage < 20) {
                      level = "Insuficiente"
                      levelClass = "level-insuficiente"
                    } else if (percentage < 70) {
                      level = "Suficiente"
                      levelClass = "level-suficiente"
                    }
                  }

                  return `
                <tr class="${index % 2 === 0 ? "row-even" : "row-odd"}">
                  <td>${vehicle.vehicle_brand || ""}</td>
                  <td><strong>${vehicle.vehicle_plate || ""}</strong></td>
                  <td>${vehicle.vehicle_model || ""}</td>
                  <td class="type-${vehicle.vehicle_type.toLowerCase()}">${vehicle.vehicle_type}</td>
                  <td><strong>${vehicle.charge_percentage}%</strong></td>
                  <td class="${levelClass}">${level}</td>
                  <td class="status-${vehicle.is_unavailable ? 'unavailable' : vehicle.status}">
                    ${vehicle.is_unavailable 
                      ? "No Disponible"
                      : vehicle.status === "revisado" 
                        ? (vehicle.status_date ? format(new Date(vehicle.status_date), "dd/MM/yyyy") : "Revisado")
                        : "Pendiente"
                    }
                  </td>
                  <td>${vehicle.is_charging ? "Sí" : "No"}</td>
                  <td>${vehicle.observations || ""}</td>
                </tr>
              `
                })
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `

      // Crear un blob con el contenido HTML
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)

      // Abrir en una nueva ventana para imprimir
      const printWindow = window.open(url, "_blank")
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
      console.error("Error generando PDF:", error)
      toast.error("Error al generar el PDF")
    }
  }

  const handleExport = async (type: "pdf" | "excel") => {
    if (vehicles.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    setIsExporting(true)
    try {
      if (type === "excel") {
        const csv = generateCSV(vehicles)
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `baterias_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Archivo CSV descargado correctamente")
      } else {
        await generatePDF(vehicles)
        toast.success("PDF generado correctamente")
      }
    } catch (error) {
      console.error("Error en la exportación:", error)
      toast.error("Error al exportar los datos")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleExport("pdf")}
        disabled={isExporting}
        className="h-9 w-9"
        title="Imprimir PDF"
      >
        <Printer className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleExport("excel")}
        disabled={isExporting}
        className="h-9 w-9"
        title="Exportar CSV"
      >
        <FileSpreadsheet className="h-4 w-4" />
      </Button>
    </>
  )
}

