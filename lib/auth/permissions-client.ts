import { createClientComponentClient } from "@/lib/supabase/client"

// Función para obtener los roles del usuario actual (lado del cliente)
export async function getUserRolesClient(): Promise<string[]> {
  const supabase = createClientComponentClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("⚠️ [getUserRolesClient] No hay usuario autenticado en el cliente.")
      return []
    }

    console.log("✅ [getUserRolesClient] Usuario autenticado ID:", user.id)

    // Intentar obtener roles desde user_roles
    const { data: userRoles, error: userRolesError } = await supabase
      .from("user_roles")
      .select(`
        roles (
          name
        )
      `)
      .eq("user_id", user.id)

    if (!userRolesError && userRoles && userRoles.length > 0) {
      const roles = userRoles.map((ur: any) => ur.roles?.name).filter(Boolean)
      console.log("✅ [getUserRolesClient] Roles obtenidos desde user_roles:", roles)
      return roles.map((role: string) => role.toLowerCase())
    }

    // Fallback: intentar obtener desde profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profileError && profileData?.role) {
      const roles = profileData.role.split(", ").map((role: string) => role.toLowerCase().trim())
      console.log("✅ [getUserRolesClient] Roles obtenidos desde profiles:", roles)
      return roles
    }

    console.log("⚠️ [getUserRolesClient] No se encontraron roles")
    return []
  } catch (error) {
    console.error("❌ [getUserRolesClient] Error inesperado:", error)
    return []
  }
}

// Función para verificar si el usuario es administrador (lado del cliente)
export async function isUserAdminClient(): Promise<boolean> {
  try {
    console.log("⚙️ [isUserAdminClient] Verificando si el usuario es administrador...")
    const roles = await getUserRolesClient()
    console.log("✅ [isUserAdminClient] Roles obtenidos para verificación de admin:", roles)
    
    // Verificar cualquier rol de administrador (considerando mayúsculas/minúsculas)
    const isAdmin = roles.some((role) => {
      const lowerRole = role.toLowerCase()
      return lowerRole === "admin" || 
             lowerRole === "administrador" || 
             lowerRole === "administración" ||
             lowerRole.includes("admin")
    })
    
    console.log("🛡️ [isUserAdminClient] Resultado de verificación de admin:", isAdmin)
    return isAdmin
  } catch (error) {
    console.error("❌ [isUserAdminClient] Error inesperado al verificar si es admin:", error)
    return false
  }
}

// Función para verificar si el usuario es supervisor o director (lado del cliente)
export async function isUserSupervisorOrDirectorClient(): Promise<boolean> {
  try {
    console.log("⚙️ [isUserSupervisorOrDirectorClient] Verificando si el usuario es supervisor o director...")
    const roles = await getUserRolesClient()
    console.log("✅ [isUserSupervisorOrDirectorClient] Roles obtenidos:", roles)
    
    // Verificar roles de supervisión (considerando mayúsculas/minúsculas)
    const isSupervisorOrDirector = roles.some((role) => {
      const lowerRole = role.toLowerCase()
      return lowerRole === "supervisor" || 
             lowerRole === "director" ||
             lowerRole.includes("supervisor") ||
             lowerRole.includes("director")
    })
    
    console.log("🛡️ [isUserSupervisorOrDirectorClient] Resultado:", isSupervisorOrDirector)
    return isSupervisorOrDirector
  } catch (error) {
    console.error("❌ [isUserSupervisorOrDirectorClient] Error inesperado:", error)
    return false
  }
}

// Función para verificar si el usuario puede editar (lado del cliente)
export async function canUserEditClient(): Promise<boolean> {
  try {
    const isAdmin = await isUserAdminClient()
    const isSupervisorOrDirector = await isUserSupervisorOrDirectorClient()
    
    return isAdmin || isSupervisorOrDirector
  } catch (error) {
    console.error("❌ [canUserEditClient] Error inesperado:", error)
    return false
  }
}

// Función para obtener el primer rol del usuario (lado del cliente)
export async function getUserRoleClient(): Promise<string | null> {
  try {
    const roles = await getUserRolesClient()
    return roles.length ? roles[0] : null
  } catch (error) {
    console.error("❌ [getUserRoleClient] Error inesperado:", error)
    return null
  }
}

// Función para verificar si el usuario tiene un rol específico (lado del cliente)
export async function hasRoleClient(roleName: string): Promise<boolean> {
  try {
    const roles = await getUserRolesClient()
    return roles.some(role => role.toLowerCase() === roleName.toLowerCase())
  } catch (error) {
    console.error("❌ [hasRoleClient] Error inesperado:", error)
    return false
  }
} 