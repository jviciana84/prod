export interface Location {
  id: number
  name: string
  address?: string
  city?: string
  postal_code?: string
  phone?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface ExpenseType {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VehicleTransport {
  id: number
  license_plate: string
  model: string
  origin_location_id: number
  origin_location?: Location
  expense_charge?: string
  expense_type_id?: number
  expense_type?: ExpenseType
  purchase_date: string
  transport_date?: string
  waiting_days?: number
  is_received: boolean
  reception_date?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TransportFormData {
  license_plate: string
  model: string
  origin_location_id: number
  expense_type_id: number
  purchase_date: string
  notes?: string
}

export interface StockItem {
  id: string
  license_plate: string
  model?: string
  reception_date?: string
  inspection_date?: string
  paint_status?: string
  paint_status_date?: string
  body_status?: string
  body_status_date?: string
  mechanical_status?: string
  mechanical_status_date?: string
  work_center?: string
  external_provider?: string
  work_order?: string
  expense_charge?: string
  created_at?: string
  updated_at?: string
  or_value?: string
  is_sold?: boolean
  // Nuevos campos para sistema de recepción física
  physical_reception_date?: string
  is_available?: boolean
  auto_marked_received?: boolean
}

export interface StockHistory {
  id: string
  stock_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_at: string
}

export const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente", color: "text-amber-500" },
  { value: "en_proceso", label: "En proceso", color: "text-blue-500" },
  { value: "apto", label: "Apto", color: "text-green-500" },
  { value: "no_apto", label: "No apto", color: "text-red-500" },
]

export const WORK_CENTER_OPTIONS = [
  { value: "Terrassa", label: "Terrassa" },
  { value: "Sabadell", label: "Sabadell" },
  { value: "Vilanova", label: "Vilanova" },
  { value: "Sant Fruitos", label: "Sant Fruitos" },
  { value: "Externo", label: "Externo" },
]
