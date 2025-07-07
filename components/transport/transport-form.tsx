"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Location, VehicleTransport, TransportFormData, ExpenseType } from "@/lib/types/transport"

interface TransportFormProps {
  transport?: VehicleTransport
  locations: Location[]
}

export default function TransportForm({ transport, locations }: TransportFormProps) {
  const [formData, setFormData] = useState<TransportFormData>({
    license_plate: transport?.license_plate || "",
    model: transport?.model || "",
    origin_location_id: transport?.origin_location_id || 0,
    expense_type_id: transport?.expense_type_id || 0,
    purchase_date: transport?.purchase_date || "",
    notes: transport?.notes || "",
  })

  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    transport?.purchase_date ? new Date(transport.purchase_date) : undefined,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Añadir logging para depuración
  useEffect(() => {
    console.log("Transport data:", transport)
    console.log("Transport ID:", transport?.id, "Type:", typeof transport?.id)
  }, [transport])

  useEffect(() => {
    // Cargar tipos de gastos
    const fetchExpenseTypes = async () => {
      const { data, error } = await supabase.from("expense_types").select("*").eq("is_active", true).order("name")

      if (error) {
        console.error("Error al cargar tipos de gastos:", error)
        return
      }

      setExpenseTypes(data || [])
    }

    fetchExpenseTypes()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar campos obligatorios
      if (
        !formData.license_plate ||
        !formData.model ||
        !formData.origin_location_id ||
        !purchaseDate ||
        !formData.expense_type_id
      ) {
        throw new Error("Por favor, completa todos los campos obligatorios")
      }

      // Obtener el nombre del tipo de gasto seleccionado
      const selectedExpenseType = expenseTypes.find(
        (type) => type.id === Number.parseInt(formData.expense_type_id.toString()),
      )
      const expenseCharge = selectedExpenseType?.name || null

      // Preparar datos para enviar - incluir tanto expense_type_id como expense_charge
      const dataToSend = {
        license_plate: formData.license_plate,
        model: formData.model,
        origin_location_id: formData.origin_location_id,
        expense_type_id: formData.expense_type_id,
        expense_charge: expenseCharge, // ✅ Agregar el nombre del tipo de gasto
        purchase_date: purchaseDate.toISOString().split("T")[0],
      }

      console.log("Datos a enviar:", dataToSend)
      console.log("ID del transporte:", transport?.id, "Tipo:", typeof transport?.id)
      console.log("Tipo de gasto seleccionado:", selectedExpenseType)

      let response

      if (transport?.id) {
        // Actualizar transporte existente
        response = await supabase.from("nuevas_entradas").update(dataToSend).eq("id", transport.id)
      } else {
        // Crear nuevo transporte
        response = await supabase.from("nuevas_entradas").insert(dataToSend)
      }

      if (response.error) {
        console.error("Error de Supabase:", response.error)
        throw response.error
      }

      toast({
        title: transport?.id ? "Nueva entrada actualizada" : "Nueva entrada registrada",
        description: transport?.id
          ? "Los datos de la nueva entrada han sido actualizados exitosamente"
          : "La nueva entrada ha sido registrada exitosamente",
      })

      router.push("/dashboard/nuevas-entradas")
      router.refresh()
    } catch (error: any) {
      console.error("Error al guardar nueva entrada:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la nueva entrada",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="license_plate">
            Matrícula <span className="text-red-500">*</span>
          </Label>
          <Input
            id="license_plate"
            name="license_plate"
            value={formData.license_plate}
            onChange={handleChange}
            placeholder="Ej: 1234ABC"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">
            Modelo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="Ej: BMW Serie 3"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="origin_location_id">
            Sede Origen <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.origin_location_id.toString()}
            onValueChange={(value) => handleSelectChange("origin_location_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar sede" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense_type_id">
            Cargo Gastos <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.expense_type_id.toString()}
            onValueChange={(value) => handleSelectChange("expense_type_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo de gasto" />
            </SelectTrigger>
            <SelectContent>
              {expenseTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_date">
            Día Compra <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !purchaseDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {purchaseDate ? format(purchaseDate, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={purchaseDate} onSelect={setPurchaseDate} initialFocus locale={es} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Mantenemos el campo de notas en la UI pero no lo enviamos a la base de datos */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas (No se guardarán - campo no disponible en la base de datos)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Información adicional sobre el transporte"
          rows={4}
          disabled
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" type="button" onClick={() => router.push("/dashboard/nuevas-entradas")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {transport?.id ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
