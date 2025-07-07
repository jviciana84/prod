"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DollarSign } from "lucide-react"

interface ExpenseType {
  id: number
  name: string
  description: string
  is_active: boolean
}

interface ExpenseTypeSelectorProps {
  value: number | null
  onChange: (value: number | null) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function ExpenseTypeSelector({
  value,
  onChange,
  label = "Tipo de Gasto",
  placeholder = "Seleccionar tipo de gasto",
  disabled = false,
}: ExpenseTypeSelectorProps) {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchExpenseTypes() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("expense_types").select("*").eq("is_active", true).order("name")

        if (error) {
          throw new Error(`Error al cargar tipos de gastos: ${error.message}`)
        }

        setExpenseTypes(data || [])
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenseTypes()
  }, [supabase])

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="expense-type-selector">{label}</Label>}
      <Select
        value={value?.toString() || ""}
        onValueChange={(val) => onChange(val ? Number.parseInt(val) : null)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="expense-type-selector" className="w-full">
          <SelectValue placeholder={placeholder}>
            {value !== null && expenseTypes.find((type) => type.id === value)?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="-1">
            <span className="text-muted-foreground">Sin tipo de gasto</span>
          </SelectItem>
          {expenseTypes.map((type) => (
            <SelectItem key={type.id} value={type.id.toString()}>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{type.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
