"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { updateIncentiveDetails } from "@/server-actions/incentivos-actions"
import { cn } from "@/lib/utils"
import { Car, Tag, Check, Calendar } from "lucide-react"
import type { Incentivo } from "@/types/incentivos"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface IncentivePendingRowProps {
  incentivo: Incentivo
  onUpdate: () => void
  index: number
  isAdmin: boolean
  selectedRowId?: string | null
  onRowClick?: (id: string, event: React.MouseEvent) => void
}

export function IncentivePendingRow({ incentivo, onUpdate, index, isAdmin, selectedRowId, onRowClick }: IncentivePendingRowProps) {
  const [garantia, setGarantia] = useState<number | string>(incentivo.garantia || "")
  const [gastos360, setGastos360] = useState<number | string>(incentivo.gastos_360 || "")
  const [isSaving, setIsSaving] = useState(false)
  const [noGastos360, setNoGastos360] = useState(incentivo.gastos_360 === 0)

  useEffect(() => {
    setGarantia(incentivo.garantia || "")
    setGastos360(incentivo.gastos_360 || "")
    setNoGastos360(incentivo.gastos_360 === 0)
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

  const handleNoGastos360Change = async (checked: boolean) => {
    setIsSaving(true)
    try {
      if (checked) {
        // Si se marca el checkbox, establecer gastos_360 a 0
        setGastos360(0)
        setNoGastos360(true)
        const result = await updateIncentiveDetails(incentivo.id, "gastos_360", 0)
        if (result.success) {
          toast.success("Gastos 360 establecidos a 0 (sin gastos)")
          onUpdate()
        } else {
          toast.error(result.message || "Error al actualizar gastos 360")
        }
      } else {
        // Si se desmarca, establecer gastos_360 a null
        setGastos360("")
        setNoGastos360(false)
        const result = await updateIncentiveDetails(incentivo.id, "gastos_360", null)
        if (result.success) {
          toast.success("Gastos 360 reseteados")
          onUpdate()
        } else {
          toast.error(result.message || "Error al actualizar gastos 360")
        }
      }
    } catch (error) {
      console.error("Error updating gastos 360:", error)
      toast.error("Error al actualizar gastos 360")
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

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === "" || dateString === "null" || dateString === "undefined") return "-"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "-"
      return date.toLocaleDateString("es-ES")
    } catch (error) {
      console.error("Error formatting date:", dateString, error)
      return "-"
    }
  }

  const handleRowClick = (event: React.MouseEvent) => {
    // No deseleccionar si se hace clic en elementos interactivos
    const target = event.target as Element
    if (target.closest('button') || 
        target.closest('input') || 
        target.closest('[role="combobox"]') || 
        target.closest('span[onClick]') ||
        target.closest('a') ||
        target.closest('[data-interactive]') ||
        target.closest('label')) {
      return
    }
    
    if (onRowClick) {
      onRowClick(incentivo.id.toString(), event)
    }
  }

  return (
    <>
      <TableRow 
        className={cn(
          "transition-all duration-300 ease-in-out cursor-pointer border-b relative",
          index % 2 === 0 ? "bg-background" : "bg-[hsl(240_4.8%_95.9%_/_0.1)] dark:bg-[hsl(240_6%_22%_/_0.1)]",
          selectedRowId === incentivo.id.toString() 
            ? "border-2 border-primary shadow-md bg-primary/5" 
            : "hover:bg-[hsl(240_4.8%_95.9%_/_0.3)] dark:hover:bg-[hsl(240_6%_22%_/_0.3)]",
        )}
        data-selected={selectedRowId === incentivo.id.toString()}
        onClick={handleRowClick}
      >
        <TableCell className="py-3 px-4 text-left">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
              <Calendar className="h-3 w-3 text-orange-500" />
            </div>
            <span className="text-sm font-medium text-foreground/80">{formatDate(incentivo.fecha_entrega)}</span>
          </div>
        </TableCell>
        <TableCell className="py-3 px-4 font-medium text-left">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Car className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">{incentivo.matricula}</span>
          </div>
        </TableCell>
        <TableCell className="py-3 px-4 text-left">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Tag className="h-3 w-3 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-foreground/80">{incentivo.or || "-"}</span>
          </div>
        </TableCell>
        <TableCell className="py-3 px-4 text-left">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <Tag className="h-3 w-3 text-green-500" />
            </div>
            <span className="text-sm font-semibold text-foreground">{incentivo.asesor}</span>
          </div>
        </TableCell>
        <TableCell className="py-3 px-4 text-left">
          {isAdmin ? (
            incentivo.garantia === 0 ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors border-green-200">
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
                className="w-24 h-8 text-xs text-center border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background hover:bg-muted/50"
              />
            )
          ) : (
            <span className="text-sm font-semibold text-foreground">{formatGarantia(incentivo.garantia)}</span>
          )}
        </TableCell>
        <TableCell className="py-3 px-4 text-left relative">
          {isAdmin ? (
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={noGastos360 ? "0" : gastos360}
                onChange={(e) => {
                  if (!noGastos360) {
                    const newValue = e.target.value === "" ? "" : Number(e.target.value)
                    setGastos360(newValue)
                  }
                }}
                onBlur={(e) => {
                  if (!noGastos360) {
                    handleSaveField("gastos_360", e.target.value === "" ? null : Number(e.target.value))
                  }
                }}
                className="w-24 h-8 text-xs text-center border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-background hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="0.00"
                disabled={noGastos360}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`no-gastos-360-${incentivo.id}`}
                  checked={noGastos360}
                  onCheckedChange={handleNoGastos360Change}
                  className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 hover:border-blue-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                  disabled={isSaving}
                />
                <label 
                  htmlFor={`no-gastos-360-${incentivo.id}`}
                  className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors font-medium"
                >
                  Sin gastos
                </label>
              </div>
            </div>
          ) : (
            <span className="text-sm font-semibold text-foreground">
              {incentivo.gastos_360 === 0 ? "Sin gastos" : formatCurrency(incentivo.gastos_360)}
            </span>
          )}
          
          {/* Indicador de selección - punto en la esquina superior derecha */}
          {selectedRowId === incentivo.id.toString() && (
            <div
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                width: '8px',
                height: '8px',
                backgroundColor: 'hsl(var(--primary))',
                borderRadius: '50%',
                zIndex: 10,
              }}
            />
          )}
        </TableCell>
      </TableRow>
    </>
  )
}
