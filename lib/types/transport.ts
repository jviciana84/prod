export interface VehicleTransport {
  id: number
  license_plate: string
  model: string
  date: string
  created_at?: string
  updated_at?: string
  purchase_price?: number | null // Asegurarnos de que el tipo es correcto
  // otros campos...
}

export interface TransportFormData {
  license_plate: string
  model: string
  date: string
  purchase_price?: string // En el formulario es string
  // otros campos...
}
