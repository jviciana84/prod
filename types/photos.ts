export interface Photographer {
  id: number
  user_id: string
  percentage: number
  is_active: boolean
  display_name?: string
}

export interface PhotoAssignment {
  id: string
  license_plate: string
  model: string
  assigned_to: string | null
  original_assigned_to: string | null
  photos_completed: boolean
  estado_pintura: string
}

export interface AssignmentStats {
  photographerId: string
  photographerName: string
  targetPercentage: number
  actualPercentage: number
  assignedCount: number
  isActive: boolean
  difference: number
}
