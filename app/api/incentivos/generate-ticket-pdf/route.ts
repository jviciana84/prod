import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"

export async function POST(request: NextRequest) {
  try {
    const { incentivo, breakdown } = await request.json()

    console.log("📄 Generando PDF del ticket para:", incentivo.matricula)

    // Crear el documento PDF
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    })

    // Buffer para almacenar el PDF
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(chunk))

    const formatCurrency = (amount: number | null) => {
      if (amount === null || amount === undefined) return "0,00 €"
      return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
    }

    const formatGarantia = (garantia: number) => {
      if (garantia === 0) return "Fabricante (0,00€)"
      return formatCurrency(garantia)
    }

    const formatDate = (dateString: string | null) => {
      if (!dateString) return "-"
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES")
    }

    // Encabezado
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("MUNICH GROUP", { align: "center" })
      .fontSize(16)
      .text("INCENTIVOS", { align: "center" })
      .fontSize(12)
      .text(`${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}`, { align: "center" })
      .moveDown()

    // Línea separadora
    doc.text("═══════════════════════════════════════════════════════════════", { align: "center" })
    doc.moveDown()

    // Información del vehículo
    doc.fontSize(14).font("Helvetica-Bold").text("INFORMACIÓN DEL VEHÍCULO:")
    doc.fontSize(12).font("Helvetica")
    doc.text(`• MATRÍCULA: ${incentivo.matricula}`)
    doc.text(`• MODELO: ${incentivo.modelo}`)
    doc.text(`• FECHA DE ENTREGA: ${formatDate(incentivo.fecha_entrega)}`)
    doc.text(`• FORMA DE PAGO: ${incentivo.financiado ? "FINANCIADO" : "CONTADO"}`)
    doc.text(`• ASESOR: ${incentivo.asesor}`)
    doc.moveDown()

    // Línea separadora
    doc.text("═══════════════════════════════════════════════════════════════", { align: "center" })
    doc.moveDown()

    // Título del modelo
    doc.fontSize(14).font("Helvetica-Bold")
    doc.text(breakdown.margenNeto > 0 ? "MODELO MARGEN NETO POSITIVO" : "MODELO MARGEN NETO NEGATIVO", {
      align: "center",
    })
    doc.moveDown()

    // Cálculo detallado
    doc.fontSize(12).font("Helvetica-Bold").text("CÁLCULO DETALLADO:")
    doc.fontSize(12).font("Helvetica")
    doc.text(`• Precio de venta: ${formatCurrency(breakdown.precioVenta)}`)
    doc.text(`• Precio compra: - ${formatCurrency(breakdown.precioCompra)}`)
    doc.text("─────────────────────────────────────────────────────────────")
    doc.text(`• Margen bruto: ${formatCurrency(breakdown.margenBruto)}`)
    doc.text(`• Gastos estructura: - ${formatCurrency(breakdown.gastosEstructura)}`)
    doc.text(`• Garantía: - ${formatGarantia(breakdown.garantia)}`)
    doc.text(`• Gastos 360º: - ${formatCurrency(breakdown.gastos360)}`)
    doc.text("─────────────────────────────────────────────────────────────")
    doc.text(`• Margen neto: ${formatCurrency(breakdown.margenNeto)}`)
    doc.moveDown()

    // Incentivos
    doc.fontSize(12).font("Helvetica-Bold").text("INCENTIVOS:")
    doc.fontSize(12).font("Helvetica")
    doc.text(
      `• ${breakdown.porcentajeIncentivo}% Incentivo: ${formatCurrency(breakdown.incentivoPorcentaje)}${breakdown.aplicaMinimo ? "*" : ""}`,
    )

    if (breakdown.aplicaMinimo) {
      doc.text(`• Importe base mínimo: + ${formatCurrency(breakdown.importeBaseMinimo)}`)
    }

    if (breakdown.financiado) {
      doc.text("• Financiado: + 50,00€")
    }

    if (breakdown.antiguedad) {
      doc.text("• Antigüedad: + 50,00€")
    }

    if (breakdown.otros > 0) {
      doc.text(`• Otros: + ${formatCurrency(breakdown.otros)}`)
    }

    doc.moveDown()
    doc.text("═══════════════════════════════════════════════════════════════", { align: "center" })
    doc.fontSize(16).font("Helvetica-Bold")
    doc.text(`TOTAL INCENTIVO: ${formatCurrency(breakdown.totalIncentivo)}`, { align: "center" })
    doc.text("═══════════════════════════════════════════════════════════════", { align: "center" })
    doc.moveDown()

    // Nota del mínimo
    if (breakdown.aplicaMinimo) {
      doc.fontSize(10).font("Helvetica")
      doc.text(
        `* No aplica por no llegar al mínimo. Se aplica base mínima de ${formatCurrency(breakdown.importeBaseMinimo)}.`,
      )
      doc.moveDown()
    }

    // Observaciones
    if (breakdown.otrosObservaciones) {
      doc.fontSize(12).font("Helvetica-Bold").text("OBSERVACIONES:")
      doc.fontSize(12).font("Helvetica").text(breakdown.otrosObservaciones)
      doc.moveDown()
    }

    // Footer
    doc.fontSize(10).font("Helvetica")
    doc.text(`Configuración: ${breakdown.porcentajeIncentivo}% | Min: ${formatCurrency(breakdown.importeBaseMinimo)}`)
    doc.moveDown()
    doc.text("¡Gracias por tu excelente trabajo!", { align: "center" })
    doc.text("MUNICH GROUP - Sistema CVO", { align: "center" })

    // Finalizar el documento
    doc.end()

    // Esperar a que se complete la generación
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks))
      })
    })

    console.log("✅ PDF generado correctamente, tamaño:", pdfBuffer.length)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Ticket_Incentivo_${incentivo.matricula}_${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("❌ Error generating PDF:", error)
    return NextResponse.json(
      {
        error: "Error al generar el PDF del ticket",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
