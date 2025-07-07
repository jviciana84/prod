"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { updateIncentiveDetails } from "@/server-actions/incentivos-actions"
import { cn } from "@/lib/utils"
import { Car, Tag } from "lucide-react" // Eliminar Receipt
import type { Incentivo } from "@/types/incentivos"
import { Badge } from "@/components/ui/badge"
// import { WarrantyDetailModal } from "@/components/modals/warranty-detail-modal" // Comentar o eliminar si no se usa

interface IncentivePendingRowProps {
  incentivo: Incentivo
  onUpdate: () => void
  index: number
  isAdmin: boolean
}

export function IncentivePendingRow({ incentivo, onUpdate, index, isAdmin }: IncentivePendingRowProps) {
  const [garantia, setGarantia] = useState<number | string>(incentivo.garantia || "")
  const [gastos360, setGastos360] = useState<number | string>(incentivo.gastos_360 || "")
  const [isSaving, setIsSaving] = useState(false)
  // const [showDetailModal, setShowDetailModal] = useState(false) // Eliminar estado del modal

  useEffect(() => {
    setGarantia(incentivo.garantia || "")
    setGastos360(incentivo.gastos_360 || "")
  }, [incentivo])

  const handleSaveField = async (field: string, value: any) => {
    setIsSaving(true)
    try {
      const result = await updateIncentiveDetails(incentivo.id, field, value)
      if (result.success) {
        toast.success(result.message)
        onUpdate()
      } else {
        toast.error(result.message)
        onUpdate()
      }
    } catch (error) {
      console.error("Error saving incentive field:", error)
      toast.error("Error al guardar el campo del incentivo.")
      onUpdate()
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "-"
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
  }

  const formatGarantia = (garantia: number | null) => {
    if (garantia === null || garantia === undefined) return "-"
    if (garantia === 0) return "Fabricante"
    return formatCurrency(garantia)
  }

  return (
    <>
      <TableRow className={cn("hover:bg-muted/50 transition-colors", index % 2 === 0 ? "bg-muted/20" : "")}>
        <TableCell className="py-2 px-4 font-medium">
          <div className="flex items-center gap-2">
            {/* Eliminado el botón "Ver Detalle" y el icono de ticket */}
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm">{incentivo.matricula}</span>
          </div>
        </TableCell>
        <TableCell className="py-2 px-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{incentivo.or || "-"}</span>
          </div>
        </TableCell>
        <TableCell className="py-2 px-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{incentivo.asesor}</span>
          </div>
        </TableCell>
        <TableCell className="py-2 px-4 text-center">
          {isAdmin ? (
            incentivo.garantia === 0 ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100/80">
                Fabricante
              </Badge>
            ) : (
              <Input
                type="number"
                value={garantia}
                onChange={(e) => {
                  const newValue = e.target.value === "" ? "" : Number(e.target.value)
                  setGarantia(newValue)
                }}
                onBlur={(e) => handleSaveField("garantia", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="0.00"
                className="w-24 h-8 text-xs text-center mx-auto border-input focus:border-primary"
              />
            )
          ) : (
            <span className="text-sm font-medium">{formatGarantia(incentivo.garantia)}</span>
          )}
        </TableCell>
        <TableCell className="py-2 px-4 text-center">
          {isAdmin ? (
            <Input
              type="number"
              value={gastos360}
              onChange={(e) => {
                const newValue = e.target.value === "" ? "" : Number(e.target.value)
                setGastos360(newValue)
              }}
              onBlur={(e) => handleSaveField("gastos_360", e.target.value === "" ? null : Number(e.target.value))}
              className="w-24 h-8 text-xs text-center mx-auto border-input focus:border-primary"
              placeholder="0.00"
            />
          ) : (
            <span className="text-sm font-medium">{formatCurrency(incentivo.gastos_360)}</span>
          )}
        </TableCell>
      </TableRow>

      {/* El modal ya no se renderiza aquí, se asume que se abrirá desde otro lugar si es necesario */}
      {/* <WarrantyDetailModal incentivo={incentivo} open={showDetailModal} onOpenChange={setShowDetailModal} /> */}
    </>
  )
}
