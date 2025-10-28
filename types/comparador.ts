export interface VehiculoComparador {
  id: string
  user_id: string
  vin: string
  pdf_url: string
  pdf_filename: string
  
  // Datos del vehículo
  marca?: string
  modelo?: string
  version?: string
  color?: string
  tapiceria?: string
  equipacion: string[]
  
  // Datos opcionales manuales
  kilometros?: number
  fecha_matriculacion?: string
  precio?: number
  
  // Metadatos
  created_at: string
  updated_at: string
}

export interface UploadResult {
  filename: string
  success: boolean
  data?: VehiculoComparador
  error?: string
}

export interface ComparadorUploadResponse {
  results: UploadResult[]
}

