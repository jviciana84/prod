"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Receipt, Car, User, TrendingUp, Mail, Printer } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Incentivo } from "@/types/incentivos"

interface WarrantyDetailModalProps {
  incentivo: Incentivo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WarrantyDetailModal({ incentivo, open, onOpenChange }: WarrantyDetailModalProps) {
  if (!incentivo) return null

  const calculateDetails = () => {
    const precioVenta = incentivo.precio_venta || 0
    const precioCompra = incentivo.precio_compra || 0
    const margen = precioVenta - precioCompra
    const importeMinimo = incentivo.importe_minimo || 150
    const porcentajeMargen = incentivo.porcentaje_margen_config_usado || 10

    let importeBase = 0
    if (margen >= 1500) {
      importeBase = importeMinimo + (margen - 1500) * (porcentajeMargen / 100)
    } else {
      importeBase = importeMinimo
    }

    const bonusAntiguedad = incentivo.antiguedad ? 50 : 0
    const bonusFinanciado = incentivo.financiado ? 50 : 0
    const gastosEstructura = incentivo.gastos_estructura || 0
    const garantia = incentivo.garantia || 0
    const gastos360 = incentivo.gastos_360 || 0
    const otros = incentivo.otros || 0

    const subtotal = importeBase + bonusAntiguedad + bonusFinanciado + otros
    const descuentos = gastosEstructura + garantia + gastos360
    const total = Math.max(0, subtotal - descuentos)

    return {
      precioVenta,
      precioCompra,
      margen,
      importeMinimo,
      porcentajeMargen,
      importeBase,
      bonusAntiguedad,
      bonusFinanciado,
      gastosEstructura,
      garantia,
      gastos360,
      otros,
      subtotal,
      descuentos,
      total,
    }
  }

  const details = calculateDetails()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  const handleSendEmail = () => {
    const subject = `Detalle de Incentivo - ${incentivo.matricula}`
    const body = `
Detalle de Incentivo - Munich Group
=====================================

Vehículo: ${incentivo.matricula}
Modelo: ${incentivo.modelo || "N/A"}
Asesor: ${incentivo.asesor || "N/A"}
Fecha: ${formatDate(incentivo.fecha_entrega)}

CÁLCULO DETALLADO:
------------------
Precio Venta: ${formatCurrency(details.precioVenta)}
Precio Compra: ${formatCurrency(details.precioCompra)}
Margen: ${formatCurrency(details.margen)}

IMPORTE BASE:
Importe Mínimo: ${formatCurrency(details.importeMinimo)}
${details.margen > 1500 ? `Bonus Margen (${details.porcentajeMargen}%): ${formatCurrency(details.importeBase - details.importeMinimo)}` : ""}

BONUS ADICIONALES:
Antigüedad: ${formatCurrency(details.bonusAntiguedad)}
Financiado: ${formatCurrency(details.bonusFinanciado)}
Otros: ${formatCurrency(details.otros)}

DESCUENTOS:
Gastos Estructura: -${formatCurrency(details.gastosEstructura)}
Garantía: -${details.garantia === 0 ? "Fabricante" : formatCurrency(details.garantia)}
Gastos 360: -${formatCurrency(details.gastos360)}

TOTAL FINAL: ${formatCurrency(details.total)}
    `

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink)
  }

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Detalle de Incentivo - ${incentivo.matricula}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; background: #f5f5f5; }
            .receipt { background: white; padding: 20px; max-width: 350px; margin: 0 auto; border: 2px dashed #333; }
            .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 15px; }
            .line { display: flex; justify-content: space-between; margin: 5px 0; }
            .separator { border-top: 1px dashed #666; margin: 10px 0; }
            .total { font-weight: bold; font-size: 1.1em; border-top: 2px solid #333; padding-top: 8px; }
            .section { font-weight: bold; text-align: center; margin: 10px 0 5px 0; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h3>BMW INCENTIVOS</h3>
              <p>Detalle de Cálculo</p>
              <p>${formatDate(incentivo.fecha_entrega)}</p>
            </div>
            
            <div class="line"><span>🚗 ${incentivo.matricula}</span></div>
            <div class="line"><span>👤 ${incentivo.asesor}</span></div>
            <div style="font-size: 0.8em; color: #666;">${incentivo.modelo}</div>
            
            <div class="separator"></div>
            <div class="line"><span>Precio Venta:</span><span>${formatCurrency(details.precioVenta)}</span></div>
            <div class="line"><span>Precio Compra:</span><span>-${formatCurrency(details.precioCompra)}</span></div>
            <div class="line" style="font-weight: bold; border-top: 1px dashed #333; padding-top: 5px;"><span>Margen:</span><span>${formatCurrency(details.margen)}</span></div>
            
            <div class="separator"></div>
            <div class="line"><span>Importe Mínimo:</span><span>${formatCurrency(details.importeMinimo)}</span></div>
            ${details.margen > 1500 ? `<div class="line" style="font-size: 0.9em;"><span>+ Margen Extra (${details.porcentajeMargen}%):</span><span>${formatCurrency(details.importeBase - details.importeMinimo)}</span></div>` : ""}
            <div class="line" style="font-weight: bold;"><span>Base:</span><span>${formatCurrency(details.importeBase)}</span></div>
            
            ${
              details.bonusAntiguedad > 0 || details.bonusFinanciado > 0 || details.otros > 0
                ? `
            <div class="separator"></div>
            ${details.bonusAntiguedad > 0 ? `<div class="line" style="color: green;"><span>+ Antigüedad:</span><span>${formatCurrency(details.bonusAntiguedad)}</span></div>` : ""}
            ${details.bonusFinanciado > 0 ? `<div class="line" style="color: green;"><span>+ Financiado:</span><span>${formatCurrency(details.bonusFinanciado)}</span></div>` : ""}
            ${details.otros > 0 ? `<div class="line" style="color: green;"><span>+ Otros:</span><span>${formatCurrency(details.otros)}</span></div>` : ""}
            `
                : ""
            }
            
            ${
              details.gastosEstructura > 0 || details.garantia > 0 || details.gastos360 > 0
                ? `
            <div class="separator"></div>
            ${details.gastosEstructura > 0 ? `<div class="line" style="color: red;"><span>- Gastos Estructura:</span><span>${formatCurrency(details.gastosEstructura)}</span></div>` : ""}
            <div class="line" style="color: ${details.garantia > 0 ? "red" : "green"};"><span>- Garantía:</span><span>${details.garantia === 0 ? "Fabricante" : formatCurrency(details.garantia)}</span></div>
            ${details.gastos360 > 0 ? `<div class="line" style="color: red;"><span>- Gastos 360°:</span><span>${formatCurrency(details.gastos360)}</span></div>` : ""}
            `
                : ""
            }
            
            <div class="separator" style="border-top: 2px dashed #333;"></div>
            <div class="line total"><span>TOTAL INCENTIVO:</span><span style="color: green;">${formatCurrency(details.total)}</span></div>
            
            <div style="text-align: center; margin-top: 15px;">
              <div style="display: inline-block; padding: 5px 10px; border: 1px solid #333; background: ${incentivo.forma_pago?.toLowerCase() === "financiado" ? "#e3f2fd" : "#e8f5e8"};">
                ${incentivo.forma_pago}
              </div>
            </div>
            
            <div style="text-align: center; font-size: 0.8em; color: #666; border-top: 1px dashed #333; padding-top: 10px; margin-top: 15px;">
              <div>¡Gracias por tu excelente trabajo!</div>
              <div style="margin-top: 5px;">📈 Sistema de Incentivos Munich Group</div>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center pb-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="flex items-center justify-center gap-2 text-lg">
                  <Receipt className="h-5 w-5" />
                  Detalle de Incentivo
                </DialogTitle>
              </div>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleSendEmail} className="h-8 w-8">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Enviar por correo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePrint} className="h-8 w-8">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Imprimir</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </DialogHeader>

          {/* Ticket Style Receipt - Compacto */}
          <div className="bg-card border-2 border-dashed border-gray-300 rounded-lg p-4 font-mono text-sm space-y-2 shadow-inner">
            {/* Header */}
            <div className="text-center border-b border-dashed border-gray-300 pb-2">
              <div className="font-bold text-base">BMW INCENTIVOS</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Detalle de Cálculo</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(incentivo.fecha_entrega)}</div>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Car className="h-3 w-3" />
                <span className="font-semibold">{incentivo.matricula}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>{incentivo.asesor}</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{incentivo.modelo}</div>
            </div>

            <Separator className="border-dashed" />

            {/* Calculation Details */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Precio Venta:</span>
                <span>{formatCurrency(details.precioVenta)}</span>
              </div>
              <div className="flex justify-between">
                <span>Precio Compra:</span>
                <span>-{formatCurrency(details.precioCompra)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-dashed pt-1">
                <span>Margen:</span>
                <span>{formatCurrency(details.margen)}</span>
              </div>
            </div>

            <Separator className="border-dashed" />

            {/* Incentive Calculation */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Importe Mínimo:</span>
                <span>{formatCurrency(details.importeMinimo)}</span>
              </div>
              {details.margen > 1500 && (
                <div className="flex justify-between text-xs">
                  <span>+ Margen Extra ({details.porcentajeMargen}%):</span>
                  <span>{formatCurrency(details.importeBase - details.importeMinimo)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Base:</span>
                <span>{formatCurrency(details.importeBase)}</span>
              </div>
            </div>

            {/* Bonuses */}
            {(details.bonusAntiguedad > 0 || details.bonusFinanciado > 0 || details.otros > 0) && (
              <>
                <Separator className="border-dashed" />
                <div className="space-y-1">
                  {details.bonusAntiguedad > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>+ Antigüedad:</span>
                      <span>{formatCurrency(details.bonusAntiguedad)}</span>
                    </div>
                  )}
                  {details.bonusFinanciado > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>+ Financiado:</span>
                      <span>{formatCurrency(details.bonusFinanciado)}</span>
                    </div>
                  )}
                  {details.otros > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>+ Otros:</span>
                      <span>{formatCurrency(details.otros)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Deductions */}
            {(details.gastosEstructura > 0 || details.garantia > 0 || details.gastos360 > 0) && (
              <>
                <Separator className="border-dashed" />
                <div className="space-y-1">
                  {details.gastosEstructura > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>- Gastos Estructura:</span>
                      <span>{formatCurrency(details.gastosEstructura)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>- Garantía:</span>
                    {details.garantia === 0 ? (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                      >
                        Fabricante
                      </Badge>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">{formatCurrency(details.garantia)}</span>
                    )}
                  </div>
                  {details.gastos360 > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>- Gastos 360°:</span>
                      <span>{formatCurrency(details.gastos360)}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator className="border-double border-2" />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold border-t-2 border-dashed border-gray-800 pt-2">
              <span>TOTAL INCENTIVO:</span>
              <span className="text-green-600 dark:text-green-400">{formatCurrency(details.total)}</span>
            </div>

            {/* Payment Method */}
            <div className="text-center pt-2">
              <Badge
                variant="outline"
                className={
                  incentivo.forma_pago?.toLowerCase() === "financiado"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100"
                    : "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                }
              >
                {incentivo.forma_pago}
              </Badge>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 border-t border-dashed border-gray-300 pt-2 dark:text-gray-400">
              <div>¡Gracias por tu excelente trabajo!</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>Sistema de Incentivos Munich Group</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
