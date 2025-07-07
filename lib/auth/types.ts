export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  position: string | null
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface Permission {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface UserWithRoles extends UserProfile {
  roles: Role[]
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
}
