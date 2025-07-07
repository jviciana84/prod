"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { calculateIncentiveBreakdown, type CalculationBreakdown } from "@/lib/incentivos-calculator"
import type { Incentivo } from "@/types/incentivos"
import { Printer, Copy } from "lucide-react" // Eliminado FileText
import { toast } from "sonner"

interface WarrantyDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incentivo: Incentivo | null
}

export function WarrantyDetailModal({ open, onOpenChange, incentivo }: WarrantyDetailModalProps) {
  const [breakdown, setBreakdown] = useState<CalculationBreakdown | null>(null)
  const [loading, setLoading] = useState(false)
  // Eliminado estado generatingPDF ya que no hay botón PDF

  useEffect(() => {
    if (open && incentivo) {
      setLoading(true)
      calculateIncentiveBreakdown(incentivo)
        .then(setBreakdown)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, incentivo])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatGarantia = (garantia: number) => {
    if (garantia === 0) return "Fabricante (0,00€)"
    return formatCurrency(garantia)
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES")
  }

  const generateTicketTextContent = () => {
    // Renombrado para claridad
    if (!breakdown || !incentivo) return ""

    let ticketContent = `DETALLE INCENTIVO - ${incentivo.matricula}\n\n`
    ticketContent += `MUNICH GROUP INCENTIVOS\n`
    ticketContent += `${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}\n\n`
    ticketContent += `═══════════════════════════════════════════════════════════════\n\n`
    ticketContent += `INFORMACIÓN DEL VEHÍCULO:\n`
    ticketContent += `• MATRÍCULA: ${incentivo.matricula}\n`
    ticketContent += `• MODELO: ${incentivo.modelo}\n`
    ticketContent += `• FECHA DE ENTREGA: ${formatDate(incentivo.fecha_entrega)}\n`
    ticketContent += `• FORMA DE PAGO: ${incentivo.financiado ? "FINANCIADO" : "CONTADO"}\n`
    ticketContent += `• ASESOR: ${incentivo.asesor}\n\n`
    ticketContent += `═══════════════════════════════════════════════════════════════\n\n`
    ticketContent += `${breakdown.margenNeto > 0 ? "MODELO MARGEN NETO POSITIVO" : "MODELO MARGEN NETO NEGATIVO"}\n\n`
    ticketContent += `CÁLCULO DETALLADO:\n`
    ticketContent += `• Precio de venta: ${formatCurrency(breakdown.precioVenta)}\n`
    ticketContent += `• Precio compra: - ${formatCurrency(breakdown.precioCompra)}\n`
    ticketContent += `─────────────────────────────────────────────────────────────\n`
    ticketContent += `• Margen bruto: ${formatCurrency(breakdown.margenBruto)}\n`
    ticketContent += `• Gastos estructura: - ${formatCurrency(breakdown.gastosEstructura)}\n`
    ticketContent += `• Garantía: - ${formatGarantia(breakdown.garantia)}\n`
    ticketContent += `• Gastos 360º: - ${formatCurrency(breakdown.gastos360)}\n`
    ticketContent += `─────────────────────────────────────────────────────────────\n`
    ticketContent += `• Margen neto: ${formatCurrency(breakdown.margenNeto)}\n\n`
    ticketContent += `INCENTIVOS:\n`
    ticketContent += `• ${breakdown.porcentajeIncentivo}% Incentivo: ${formatCurrency(breakdown.incentivoPorcentaje)}${breakdown.aplicaMinimo ? "*" : ""}\n`
    if (breakdown.aplicaMinimo) {
      ticketContent += `• Importe base mínimo: + ${formatCurrency(breakdown.importeBaseMinimo)}\n`
    }
    if (breakdown.financiado) {
      ticketContent += `• Financiado: + 50,00€\n`
    }
    if (breakdown.antiguedad) {
      ticketContent += `• Antigüedad: + 50,00€\n`
    }
    if (breakdown.otros > 0) {
      ticketContent += `• Otros: + ${formatCurrency(breakdown.otros)}\n`
    }
    ticketContent += `═══════════════════════════════════════════════════════════════\n`
    ticketContent += `TOTAL INCENTIVO: ${formatCurrency(breakdown.totalIncentivo)}\n`
    ticketContent += `═══════════════════════════════════════════════════════════════\n\n`
    if (breakdown.aplicaMinimo) {
      ticketContent += `* No aplica por no llegar al mínimo. Se aplica base mínima de ${formatCurrency(breakdown.importeBaseMinimo)}.\n\n`
    }
    if (breakdown.otrosObservaciones) {
      ticketContent += `OBSERVACIONES: ${breakdown.otrosObservaciones}\n\n`
    }
    ticketContent += `Configuración: ${breakdown.porcentajeIncentivo}% | Min: ${formatCurrency(breakdown.importeBaseMinimo)}\n\n`
    ticketContent += `¡Gracias por tu excelente trabajo!\n`
    ticketContent += `MUNICH GROUP - Sistema CVO`

    return ticketContent
  }

  const handleCopy = async () => {
    if (!breakdown) {
      toast.error("No hay datos para copiar.")
      return
    }
    const ticketText = generateTicketTextContent()
    try {
      await navigator.clipboard.writeText(ticketText)
      toast.success("Datos del incentivo copiados al portapapeles.")
    } catch (err) {
      console.error("Error al copiar:", err)
      toast.error("Error al copiar los datos.")
    }
  }

  // Eliminada la función handleGeneratePDF

  if (!incentivo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-3 pb-0">
          <DialogTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
            DETALLE INCENTIVO {incentivo.matricula}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end gap-3 px-3 pb-2">
          <button
            onClick={handleCopy}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Copiar datos"
          >
            <Copy className="h-5 w-5" />
          </button>
          <button
            onClick={() => window.print()}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Imprimir"
          >
            <Printer className="h-5 w-5" />
          </button>
          {/* Botón PDF eliminado */}
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg m-3 p-5 bg-white dark:bg-gray-900 font-mono text-sm">
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <div className="text-lg font-bold tracking-wider">MUNICH GROUP</div>
            <div className="text-base font-semibold">INCENTIVOS</div>
            <div className="text-xs text-gray-600 mt-2">
              {new Date().toLocaleDateString("es-ES")} {new Date().toLocaleTimeString("es-ES")}
            </div>
          </div>
          <div className="border-b border-dashed border-gray-300 pb-3 mb-4">
            <div className="flex justify-between">
              <span>MATRICULA:</span>
              <span className="font-bold">{incentivo.matricula}</span>
            </div>
            <div className="flex justify-between">
              <span>MODELO:</span>
              <span className="font-bold">{incentivo.modelo}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA DE ENTREGA:</span>
              <span className="font-bold">{formatDate(incentivo.fecha_entrega)}</span>
            </div>
            <div className="flex justify-between">
              <span>FORMA DE PAGO:</span>
              <span className="font-bold">{incentivo.financiado ? "FINANCIADO" : "CONTADO"}</span>
            </div>
            <div className="flex justify-between">
              <span>ASESOR:</span>
              <span className="font-bold">{incentivo.asesor}</span>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Calculando...</div>
            </div>
          ) : breakdown ? (
            <>
              <div className="text-center font-bold mb-4 text-base">
                {breakdown.margenNeto > 0 ? "MODELO MARGEN NETO POSITIVO" : "MODELO MARGEN NETO NEGATIVO"}
              </div>
              <div className="space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>Precio de venta:</span>
                  <span className="font-bold">{formatCurrency(breakdown.precioVenta)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio compra:</span>
                  <span className="font-bold">- {formatCurrency(breakdown.precioCompra)}</span>
                </div>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
                <div className="flex justify-between font-bold">
                  <span>Margen bruto:</span>
                  <span>{formatCurrency(breakdown.margenBruto)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos estructura:</span>
                  <span>- {formatCurrency(breakdown.gastosEstructura)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Garantía:</span>
                  <span>- {formatGarantia(breakdown.garantia)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos 360º:</span>
                  <span>- {formatCurrency(breakdown.gastos360)}</span>
                </div>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
                <div className="flex justify-between font-bold text-base">
                  <span>Margen neto:</span>
                  <span className={breakdown.margenNeto > 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(breakdown.margenNeto)}
                  </span>
                </div>
              </div>
              <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-1">
                <div className="flex justify-between">
                  <span className={breakdown.aplicaMinimo ? "italic" : ""}>
                    {breakdown.porcentajeIncentivo}% Incentivo:
                    {breakdown.aplicaMinimo && "*"}
                  </span>
                  <span className={breakdown.aplicaMinimo ? "italic" : "font-bold"}>
                    {formatCurrency(breakdown.incentivoPorcentaje)}
                    {breakdown.aplicaMinimo && "*"}
                  </span>
                </div>
                {breakdown.aplicaMinimo && (
                  <div className="flex justify-between">
                    <span>Importe base mínimo:</span>
                    <span className="font-bold">+ {formatCurrency(breakdown.importeBaseMinimo)}</span>
                  </div>
                )}
                {breakdown.financiado && (
                  <div className="flex justify-between">
                    <span>Financiado:</span>
                    <span className="font-bold">+ 50,00€</span>
                  </div>
                )}
                {breakdown.antiguedad && (
                  <div className="flex justify-between">
                    <span>Antigüedad:</span>
                    <span className="font-bold">+ 50,00€</span>
                  </div>
                )}
                {breakdown.otros > 0 && (
                  <div className="flex justify-between">
                    <span>Otros:</span>
                    <span className="font-bold">+ {formatCurrency(breakdown.otros)}</span>
                  </div>
                )}
                <div className="border-t border-dashed border-gray-400 my-3"></div>
                <div className="flex justify-between font-bold text-lg border-2 border-gray-800 p-2 bg-gray-100 dark:bg-gray-800">
                  <span>TOTAL INCENTIVO</span>
                  <span>{formatCurrency(breakdown.totalIncentivo)}</span>
                </div>
              </div>
              {breakdown.aplicaMinimo && (
                <div className="mt-4 text-xs text-center border-t border-dashed border-gray-300 pt-3">
                  <div className="text-gray-600">* No aplica por no llegar al mínimo.</div>
                  <div className="text-gray-600">
                    Se aplica base mínima de {formatCurrency(breakdown.importeBaseMinimo)}.
                  </div>
                </div>
              )}
              {breakdown.otrosObservaciones && (
                <div className="mt-4 border-t border-dashed border-gray-300 pt-3">
                  <div className="text-xs font-bold mb-1">OBSERVACIONES:</div>
                  <div className="text-xs text-gray-600 break-words">{breakdown.otrosObservaciones}</div>
                </div>
              )}
              <div className="mt-6 text-center text-xs text-gray-500 border-t-2 border-dashed border-gray-300 pt-4">
                <div>
                  Configuración: {breakdown.porcentajeIncentivo}% | Min: {formatCurrency(breakdown.importeBaseMinimo)}
                </div>
                <div className="mt-2">¡Gracias por tu excelente trabajo!</div>
                <div className="mt-1">MUNICH GROUP - Sistema CVO</div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">Error al calcular el incentivo</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
