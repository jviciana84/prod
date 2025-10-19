"use client"

import { CommandEmpty } from "@/components/ui/command"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface TransportQuickFormProps {
  locations: any[]
  onTransportAdded: () => void
  isSubmitting: boolean
  setIsSubmitting: (value: boolean) => void
}

export default function TransportQuickForm({
  locations,
  onTransportAdded,
  isSubmitting,
  setIsSubmitting,
}: TransportQuickFormProps) {
  const [licensePlate, setLicensePlate] = useState("")
  const [model, setModel] = useState("")
  const [originLocationId, setOriginLocationId] = useState("")
  const [originLocationOpen, setOriginLocationOpen] = useState(false)
  const [expenseTypeId, setExpenseTypeId] = useState("")
  const [expenseTypeOpen, setExpenseTypeOpen] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState("")
  const [formattedDate, setFormattedDate] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [expenseTypes, setExpenseTypes] = useState<any[]>([])

  // Referencias para navegación por teclado
  const modelInputRef = useRef<HTMLInputElement>(null)
  const originLocationTriggerRef = useRef<HTMLButtonElement>(null)
  const expenseTypeTriggerRef = useRef<HTMLButtonElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const priceInputRef = useRef<HTMLInputElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const originLocationInputRef = useRef<HTMLInputElement>(null)
  const expenseTypeInputRef = useRef<HTMLInputElement>(null)

  const supabase = getSupabaseClient()
  const { toast } = useToast()

  // Cargar tipos de gastos
  useEffect(() => {
    const fetchExpenseTypes = async () => {
      const { data } = await supabase.from("expense_types").select("*").order("name")
      if (data) setExpenseTypes(data)
    }
    fetchExpenseTypes()
  }, [])

  // Formatear fecha para mostrar
  useEffect(() => {
    if (purchaseDate) {
      const [year, month, day] = purchaseDate.split("-")
      setFormattedDate(`${day}/${month}/${year}`)
    } else {
      setFormattedDate("")
    }
  }, [purchaseDate])

  const formatDateInput = (input: string) => {
    // Eliminar caracteres no numéricos
    let cleaned = input.replace(/\D/g, "")

    // Limitar a 8 dígitos (DDMMYYYY)
    cleaned = cleaned.slice(0, 8)

    // Formatear como DD/MM/YYYY
    let formatted = ""
    if (cleaned.length > 0) {
      formatted += cleaned.slice(0, Math.min(2, cleaned.length))
    }
    if (cleaned.length > 2) {
      formatted += "/" + cleaned.slice(2, Math.min(4, cleaned.length))
    }
    if (cleaned.length > 4) {
      formatted += "/" + cleaned.slice(4, 8)
    }

    return formatted
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value)
    setFormattedDate(formatted)

    // Convertir a formato YYYY-MM-DD para el valor interno
    if (formatted.length === 10) {
      // DD/MM/YYYY
      const [day, month, year] = formatted.split("/")
      setPurchaseDate(`${year}-${month}-${day}`)
    } else {
      setPurchaseDate("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar campos requeridos
      if (!licensePlate) {
        throw new Error("La matrícula es obligatoria")
      }
      if (!purchasePrice) {
        throw new Error("El precio de compra es obligatorio")
      }

      // Convertir el precio a número o null si está vacío
      const price = purchasePrice ? Number(purchasePrice.replace(",", ".")) : null

      // Validar que el precio sea un número válido si se proporciona
      if (purchasePrice && isNaN(price as number)) {
        throw new Error("El precio de compra debe ser un número válido")
      }

      const dataToSubmit = {
        license_plate: licensePlate.toUpperCase(),
        model,
        origin_location_id: originLocationId || null,
        expense_type_id: expenseTypeId || null,
        purchase_date: purchaseDate || null,
        purchase_price: price,
      }

      const response = await fetch("/api/transport/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transportData: dataToSubmit }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error al crear transporte")
      }

      // Resetear formulario
      setLicensePlate("")
      setModel("")
      setOriginLocationId("")
      setExpenseTypeId("")
      setPurchaseDate("")
      setPurchasePrice("")
      setFormattedDate("")

      // Notificar éxito
      toast({
        title: "Vehículo añadido",
        description: "El vehículo se ha añadido correctamente",
      })

      // Notificar al componente padre
      onTransportAdded()

      // Volver a enfocar la matrícula
      setTimeout(() => {
        const licenseInput = document.getElementById("quick-license-plate") as HTMLInputElement
        if (licenseInput) licenseInput.focus()
      }, 100)
    } catch (error: any) {
      console.error("Error al añadir vehículo:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el vehículo",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault()

      if (field === "license_plate") {
        modelInputRef.current?.focus()
      } else if (field === "model") {
        setOriginLocationOpen(true)
        setTimeout(() => {
          originLocationInputRef.current?.focus()
        }, 100)
      } else if (field === "origin_location") {
        // Seleccionar la primera opción si hay alguna
        const firstLocation = document.querySelector(".origin-location-item") as HTMLElement
        if (firstLocation) {
          firstLocation.click()
        } else {
          setOriginLocationOpen(false)
          setExpenseTypeOpen(true)
          setTimeout(() => {
            expenseTypeInputRef.current?.focus()
          }, 100)
        }
      } else if (field === "expense_type") {
        // Seleccionar la primera opción si hay alguna
        const firstExpenseType = document.querySelector(".expense-type-item") as HTMLElement
        if (firstExpenseType) {
          firstExpenseType.click()
        } else {
          setExpenseTypeOpen(false)
          dateInputRef.current?.focus()
        }
      } else if (field === "purchase_date") {
        priceInputRef.current?.focus()
      } else if (field === "purchase_price") {
        submitButtonRef.current?.click()
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="relative md:col-span-1">
          <Label htmlFor="quick-license-plate" className="text-xs font-medium mb-1 block">
            Matrícula
          </Label>
          <Input
            id="quick-license-plate"
            placeholder="escribe la matrícula"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
            onKeyDown={(e) => handleKeyDown(e, "license_plate")}
            className="uppercase transition-all duration-200 h-10 focus-visible:ring-blue-500"
            autoComplete="off"
          />
        </div>

        <div className="md:col-span-1">
          <Label htmlFor="quick-model" className="text-xs font-medium mb-1 block">
            Modelo
          </Label>
          <Input
            id="quick-model"
            placeholder="M2 Competition"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "model")}
            ref={modelInputRef}
            className="transition-all duration-200 h-10 focus-visible:ring-blue-500"
            autoComplete="off"
          />
        </div>

        <div className="md:col-span-1">
          <Label className="text-xs font-medium mb-1 block">Sede Origen</Label>
          <Popover open={originLocationOpen} onOpenChange={setOriginLocationOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={originLocationTriggerRef}
                variant="outline"
                role="combobox"
                aria-expanded={originLocationOpen}
                className="w-full justify-between h-10 transition-all duration-200 focus-visible:ring-blue-500"
              >
                {originLocationId
                  ? locations.find((location) => location.id === originLocationId)?.name
                  : "Seleccionar sede"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput
                  placeholder="Buscar sede..."
                  ref={originLocationInputRef}
                  onKeyDown={(e) => handleKeyDown(e, "origin_location")}
                />
                <CommandList>
                  <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                  <CommandGroup>
                    {locations.map((location) => (
                      <CommandItem
                        key={location.id}
                        value={location.name}
                        className="origin-location-item"
                        onSelect={() => {
                          setOriginLocationId(location.id)
                          setOriginLocationOpen(false)
                          setExpenseTypeOpen(true)
                          setTimeout(() => {
                            expenseTypeInputRef.current?.focus()
                          }, 100)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", originLocationId === location.id ? "opacity-100" : "opacity-0")}
                        />
                        {location.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:col-span-1">
          <Label className="text-xs font-medium mb-1 block">Cargo Gastos</Label>
          <Popover open={expenseTypeOpen} onOpenChange={setExpenseTypeOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={expenseTypeTriggerRef}
                variant="outline"
                role="combobox"
                aria-expanded={expenseTypeOpen}
                className="w-full justify-between h-10 transition-all duration-200 focus-visible:ring-blue-500"
              >
                {expenseTypeId ? expenseTypes.find((type) => type.id === expenseTypeId)?.name : "Seleccionar cargo"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput
                  placeholder="Buscar cargo..."
                  ref={expenseTypeInputRef}
                  onKeyDown={(e) => handleKeyDown(e, "expense_type")}
                />
                <CommandList>
                  <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                  <CommandGroup>
                    {expenseTypes.map((type) => (
                      <CommandItem
                        key={type.id}
                        value={type.name}
                        className="expense-type-item"
                        onSelect={() => {
                          setExpenseTypeId(type.id)
                          setExpenseTypeOpen(false)
                          dateInputRef.current?.focus()
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", expenseTypeId === type.id ? "opacity-100" : "opacity-0")}
                        />
                        {type.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:col-span-1">
          <Label htmlFor="quick-purchase-date" className="text-xs font-medium mb-1 block">
            Día Compra
          </Label>
          <Input
            id="quick-purchase-date"
            placeholder="DD/MM/AAAA"
            value={formattedDate}
            onChange={handleDateChange}
            onKeyDown={(e) => handleKeyDown(e, "purchase_date")}
            ref={dateInputRef}
            className="transition-all duration-200 h-10 focus-visible:ring-blue-500"
            autoComplete="off"
          />
        </div>

        <div className="md:col-span-1">
          <Label htmlFor="quick-purchase-price" className="text-xs font-medium mb-1 block">
            Precio Compra
          </Label>
          <Input
            id="quick-purchase-price"
            placeholder="- €"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "purchase_price")}
            ref={priceInputRef}
            className="transition-all duration-200 h-10 focus-visible:ring-blue-500"
            autoComplete="off"
            required
          />
        </div>

        <div className="md:col-span-1">
          <Label className="text-xs font-medium mb-1 block opacity-0">Acción</Label>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-10 w-full relative overflow-hidden"
            ref={submitButtonRef}
          >
            <span className="flex items-center justify-center">{isSubmitting ? "Añadiendo..." : "Añadir"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
