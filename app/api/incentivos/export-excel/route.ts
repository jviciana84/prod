// No changes to this file, the previous version (v129) already includes extensive logging.
// Please check server and browser logs as instructed.
import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function POST(request: NextRequest) {
  try {
    console.log("📊 [EXCEL] Iniciando generación de Excel...")

    // Parsear el body de la request
    let requestData
    try {
      requestData = await request.json()
      console.log("📊 [EXCEL] Request parseada correctamente")
    } catch (parseError) {
      console.error("❌ [EXCEL] Error parseando request:", parseError)
      return NextResponse.json({ error: "Error parseando los datos de la request" }, { status: 400 })
    }

    const { groupedData, filters, userFullName, currentConfig } = requestData

    // Validar datos
    if (!groupedData) {
      console.error("❌ [EXCEL] No se recibieron groupedData")
      return NextResponse.json({ error: "No se recibieron datos agrupados" }, { status: 400 })
    }

    if (Object.keys(groupedData).length === 0) {
      console.error("❌ [EXCEL] groupedData está vacío")
      return NextResponse.json({ error: "No hay datos para exportar" }, { status: 400 })
    }

    console.log("📊 [EXCEL] Datos recibidos:", {
      advisors: Object.keys(groupedData),
      totalIncentives: Object.values(groupedData).reduce((acc: number, arr: any[]) => acc + arr.length, 0),
      filters: filters || "sin filtros",
      userFullName: userFullName || "sin usuario",
      hasConfig: !!currentConfig,
    })

    // Crear el workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = userFullName || "Sistema CVO"
    workbook.created = new Date()

    console.log("📊 [EXCEL] Workbook creado")

    // Función para formatear moneda
    const formatCurrency = (amount: number | null) => {
      if (amount === null || amount === undefined) return 0
      return Number(amount) || 0
    }

    // Función para calcular incentivo simplificada
    const calculateIncentive = (incentivo: any) => {
      try {
        if (!currentConfig) {
          console.warn("⚠️ [EXCEL] No hay configuración, usando valores por defecto")
          return 150 // Valor por defecto
        }

        const precioVenta = formatCurrency(incentivo.precio_venta)
        const precioCompra = formatCurrency(incentivo.precio_compra)
        const margen = precioVenta - precioCompra

        const importeMinimo = currentConfig.importe_minimo || 150
        const porcentajeMargen = currentConfig.porcentaje_margen || 10

        let importe = 0

        if (margen >= 1500) {
          importe = importeMinimo + (margen - 1500) * (porcentajeMargen / 100)
        } else {
          importe = importeMinimo
        }

        // Bonificaciones
        if (incentivo.antiguedad) importe += 50
        if (incentivo.financiado) importe += 50

        // Deducciones
        importe -= formatCurrency(incentivo.gastos_estructura)
        importe -= formatCurrency(incentivo.garantia)
        importe -= formatCurrency(incentivo.gastos_360)

        // Otros
        importe += formatCurrency(incentivo.otros)

        return Math.max(0, importe)
      } catch (calcError) {
        console.error("❌ [EXCEL] Error calculando incentivo:", calcError)
        return 0
      }
    }

    // Crear hoja resumen
    console.log("📊 [EXCEL] Creando hoja resumen...")
    const summarySheet = workbook.addWorksheet("Resumen")

    // Configurar columnas del resumen
    summarySheet.columns = [
      { header: "Asesor", key: "asesor", width: 25 },
      { header: "Cantidad", key: "cantidad", width: 12 },
      { header: "Total Incentivos", key: "total", width: 18 },
    ]

    // Estilo del header
    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    }

    let grandTotal = 0
    let totalCount = 0

    // Agregar datos del resumen
    console.log("📊 [EXCEL] Procesando datos del resumen...")
    Object.entries(groupedData).forEach(([advisor, incentivos]: [string, any[]]) => {
      try {
        const total = incentivos.reduce((sum, incentivo) => {
          const incentiveAmount = calculateIncentive(incentivo)
          return sum + incentiveAmount
        }, 0)

        grandTotal += total
        totalCount += incentivos.length

        summarySheet.addRow({
          asesor: advisor,
          cantidad: incentivos.length,
          total: total,
        })

        console.log(`📊 [EXCEL] Asesor ${advisor}: ${incentivos.length} incentivos, total: ${total.toFixed(2)}€`)
      } catch (advisorError) {
        console.error(`❌ [EXCEL] Error procesando asesor ${advisor}:`, advisorError)
      }
    })

    // Agregar fila de totales
    const totalRow = summarySheet.addRow({
      asesor: "TOTAL",
      cantidad: totalCount,
      total: grandTotal,
    })
    totalRow.font = { bold: true }
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFCC00" },
    }

    // Formatear columna de totales como moneda
    summarySheet.getColumn("total").numFmt = "#,##0.00 €"

    console.log("📊 [EXCEL] Resumen completado. Total general:", grandTotal.toFixed(2), "€")

    // Crear hoja detallada para cada asesor
    console.log("📊 [EXCEL] Creando hojas detalladas...")
    Object.entries(groupedData).forEach(([advisor, incentivos]: [string, any[]]) => {
      try {
        console.log(`📊 [EXCEL] Creando hoja para ${advisor} con ${incentivos.length} incentivos`)

        const sheet = workbook.addWorksheet(advisor.substring(0, 30)) // Limitar nombre de hoja

        // Configurar columnas
        sheet.columns = [
          { header: "Fecha", key: "fecha", width: 12 },
          { header: "Matrícula", key: "matricula", width: 12 },
          { header: "Modelo", key: "modelo", width: 25 },
          { header: "OR", key: "or", width: 15 },
          { header: "Precio Venta", key: "precioVenta", width: 15 },
          { header: "Precio Compra", key: "precioCompra", width: 15 },
          { header: "Margen", key: "margen", width: 15 },
          { header: "Gastos Estructura", key: "gastosEstructura", width: 18 },
          { header: "Garantía", key: "garantia", width: 12 },
          { header: "Gastos 360", key: "gastos360", width: 12 },
          { header: "Financiado", key: "financiado", width: 12 },
          { header: "Antigüedad", key: "antiguedad", width: 12 },
          { header: "Otros", key: "otros", width: 12 },
          { header: "Importe Final", key: "importeFinal", width: 15 },
          { header: "Observaciones", key: "observaciones", width: 30 },
        ]

        // Estilo del header
        sheet.getRow(1).font = { bold: true }
        sheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6E6FA" },
        }

        // Agregar datos
        let advisorTotal = 0
        incentivos.forEach((incentivo, index) => {
          try {
            const precioVenta = formatCurrency(incentivo.precio_venta)
            const precioCompra = formatCurrency(incentivo.precio_compra)
            const margen = precioVenta - precioCompra
            const importeFinal = calculateIncentive(incentivo)
            advisorTotal += importeFinal

            sheet.addRow({
              fecha: incentivo.fecha_entrega ? new Date(incentivo.fecha_entrega) : null,
              matricula: incentivo.matricula || "",
              modelo: incentivo.modelo || "",
              or: incentivo.or || "",
              precioVenta: precioVenta,
              precioCompra: precioCompra,
              margen: margen,
              gastosEstructura: formatCurrency(incentivo.gastos_estructura),
              garantia: incentivo.garantia === 0 ? "Fabricante" : formatCurrency(incentivo.garantia),
              gastos360: formatCurrency(incentivo.gastos_360),
              financiado: incentivo.financiado ? "Sí" : "No",
              antiguedad: incentivo.antiguedad ? "Sí" : "No",
              otros: formatCurrency(incentivo.otros),
              importeFinal: importeFinal,
              observaciones: incentivo.otros_observaciones || "",
            })
          } catch (rowError) {
            console.error(`❌ [EXCEL] Error procesando fila ${index} de ${advisor}:`, rowError)
          }
        })

        // Formatear columnas de moneda
        const currencyColumns = [
          "precioVenta",
          "precioCompra",
          "margen",
          "gastosEstructura",
          "gastos360",
          "otros",
          "importeFinal",
        ]
        currencyColumns.forEach((col) => {
          sheet.getColumn(col).numFmt = "#,##0.00 €"
        })

        // Formatear columna de fecha
        sheet.getColumn("fecha").numFmt = "dd/mm/yyyy"

        // Agregar fila de totales
        const totalRow = sheet.addRow({
          fecha: "",
          matricula: "",
          modelo: "",
          or: "",
          precioVenta: "",
          precioCompra: "",
          margen: "",
          gastosEstructura: "",
          garantia: "",
          gastos360: "",
          financiado: "",
          antiguedad: "",
          otros: "TOTAL:",
          importeFinal: advisorTotal,
          observaciones: "",
        })
        totalRow.font = { bold: true }
        totalRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFCC00" },
        }

        console.log(`✅ [EXCEL] Hoja ${advisor} completada. Total: ${advisorTotal.toFixed(2)}€`)
      } catch (sheetError) {
        console.error(`❌ [EXCEL] Error creando hoja para ${advisor}:`, sheetError)
      }
    })

    console.log("📊 [EXCEL] Generando buffer del Excel...")

    // Generar el buffer
    const buffer = await workbook.xlsx.writeBuffer()

    console.log("✅ [EXCEL] Excel generado correctamente, tamaño:", buffer.byteLength, "bytes")

    const monthName = filters?.month !== "all" ? `_${filters.month}` : ""
    const yearName = filters?.year !== "all" ? `_${filters.year}` : ""
    const filename = `Informe_Incentivos${yearName}${monthName}_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("❌ [EXCEL] Error crítico generating Excel:", error)
    console.error("❌ [EXCEL] Stack trace:", error.stack)
    return NextResponse.json(
      {
        error: "Error al generar el informe Excel",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
