"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// Importar la función de detección de tipo de vehículo
import { detectVehicleType } from "@/utils/vehicle-type-detector"

export default function AddSalePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    license_plate: "",
    model: "",
    vehicle_type: "Coche",
    advisor: "",
    payment_method: "Contado",
    price: "",
    document_type: "DNI",
    document_id: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    client_city: "",
    client_province: "",
    client_postal_code: "",
    vin: "",
    order_number: "",
    order_date: "",
    bank: "CONTADO",
    discount: "",
    portal_origin: "",
  })

  // Modificar la función handleChange para actualizar automáticamente el tipo de vehículo cuando cambia el modelo
  // Buscar la función handleChange y reemplazarla con:

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Si el campo que cambió es el modelo, detectar automáticamente el tipo de vehículo
    if (name === "model" && value) {
      const detectedType = detectVehicleType(value)
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        vehicle_type: detectedType,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos obligatorios
      if (!formData.license_plate || !formData.model || !formData.client_name) {
        toast.error("Por favor complete los campos obligatorios: Matrícula, Modelo y Nombre del cliente")
        setLoading(false)
        return
      }

      // Formatear el precio
      let price = null
      if (formData.price) {
        const cleanPrice = formData.price
          .replace(/[^\d.,]/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
        price = Number.parseFloat(cleanPrice)
      }

      // Crear la venta
      const salesData = {
        license_plate: formData.license_plate.toUpperCase(),
        model: formData.model,
        vehicle_type: formData.vehicle_type,
        sale_date: new Date().toISOString(),
        advisor: formData.advisor,
        payment_method: formData.payment_method,
        payment_status: "pendiente",
        price: price,
        document_type: formData.document_type,
        document_id: formData.document_id,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        client_address: formData.client_address,
        client_city: formData.client_city,
        client_province: formData.client_province,
        client_postal_code: formData.client_postal_code,
        vin: formData.vin,
        order_number: formData.order_number,
        order_date: formData.order_date,
        bank: formData.bank,
        discount: formData.discount,
        portal_origin: formData.portal_origin,
        cyp_status: "pendiente",
        photo_360_status: "pendiente",
        validated: false,
      }

      const { data, error } = await supabase.from("sales_vehicles").insert([salesData]).select()

      if (error) {
        throw new Error(error.message)
      }

      toast.success("Venta registrada correctamente")
      router.push("/dashboard/ventas")
    } catch (error) {
      console.error("Error al registrar la venta:", error)
      toast.error("Error al registrar la venta: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Venta</CardTitle>
          <CardDescription>Complete los datos del vehículo vendido</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Datos del vehículo */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="license_plate">Matrícula *</Label>
                  <Input
                    id="license_plate"
                    name="license_plate"
                    value={formData.license_plate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="model">Modelo *</Label>
                  <Input id="model" name="model" value={formData.model} onChange={handleChange} required />
                </div>

                <div>
                  <Label htmlFor="vehicle_type">Tipo de Vehículo</Label>
                  <Select
                    value={formData.vehicle_type}
                    onValueChange={(value) => handleSelectChange("vehicle_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Coche">Coche</SelectItem>
                      <SelectItem value="Moto">Moto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vin">Número de Bastidor</Label>
                  <Input id="vin" name="vin" value={formData.vin} onChange={handleChange} />
                </div>

                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input id="price" name="price" value={formData.price} onChange={handleChange} />
                </div>

                <div>
                  <Label htmlFor="advisor">Asesor</Label>
                  <Input id="advisor" name="advisor" value={formData.advisor} onChange={handleChange} />
                </div>

                <div>
                  <Label htmlFor="payment_method">Método de Pago</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => handleSelectChange("payment_method", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contado">Contado</SelectItem>
                      <SelectItem value="Financiación">Financiación</SelectItem>
                      <SelectItem value="Externa">Financiación Externa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bank">Banco</Label>
                  <Input id="bank" name="bank" value={formData.bank} onChange={handleChange} />
                </div>

                <div>
                  <Label htmlFor="discount">Descuento</Label>
                  <Input id="discount" name="discount" value={formData.discount} onChange={handleChange} />
                </div>
              </div>

              {/* Datos del cliente */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client_name">Nombre del Cliente *</Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="document_type">Tipo de Documento</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => handleSelectChange("document_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="NIE">NIE</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="document_id">Número de Documento</Label>
                  <Input id="document_id" name="document_id" value={formData.document_id} onChange={handleChange} />
                </div>

                <div>
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    name="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="client_phone">Teléfono</Label>
                  <Input 
                    id="client_phone" 
                    name="client_phone" 
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.client_phone} 
                    onChange={handleChange} 
                  />
                </div>

                <div>
                  <Label htmlFor="client_address">Dirección</Label>
                  <Input
                    id="client_address"
                    name="client_address"
                    value={formData.client_address}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="client_city">Ciudad</Label>
                    <Input id="client_city" name="client_city" value={formData.client_city} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="client_postal_code">Código Postal</Label>
                    <Input
                      id="client_postal_code"
                      name="client_postal_code"
                      value={formData.client_postal_code}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="client_province">Provincia</Label>
                  <Input
                    id="client_province"
                    name="client_province"
                    value={formData.client_province}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="portal_origin">Portal de Origen</Label>
                  <Input
                    id="portal_origin"
                    name="portal_origin"
                    value={formData.portal_origin}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/dashboard/ventas")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Registrar Venta
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
