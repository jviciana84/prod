import { createClientComponentClient } from "@/lib/supabase/client"
import { createServerClient } from "@/lib/supabase/server"
import { cache } from "react"

// Función para obtener los roles del usuario actual (lado del servidor)
export const getUserRoles = cache(async () => {
  const startTime = Date.now()
  const supabase = await createServerClient()

  console.log("⚙️ [getUserRoles] Intentando obtener usuario del servidor...")
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log("⚠️ [getUserRoles] No hay usuario autenticado en el servidor. Devolviendo roles vacíos.")
    return []
  }

  console.log("✅ [getUserRoles] Usuario autenticado ID:", user.id)

  try {
    // Primero intentar obtener desde la tabla profiles (más rápido)
    console.log("⚙️ [getUserRoles] Intentando obtener rol desde profiles...")
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profileError && profileData?.role) {
      const roles = profileData.role.split(", ").map((role: string) => role.toLowerCase().trim())
      const endTime = Date.now()
      console.log(`✅ [getUserRoles] Roles obtenidos desde profiles en ${endTime - startTime}ms:`, roles)
      return roles
    }

    // Si no hay rol en profiles, usar RPC como fallback
    console.log("⚙️ [getUserRoles] Llamando a RPC 'get_user_role_names' para user_id:", user.id)
    const { data, error } = await supabase.rpc("get_user_role_names", {
      user_id_param: user.id,
    })

    if (error) {
      console.error("❌ [getUserRoles] Error fetching roles from RPC:", error)
      return []
    }

    const endTime = Date.now()
    console.log(`✅ [getUserRoles] Roles obtenidos de RPC en ${endTime - startTime}ms:`, data)
    // Asegurarse de que todos los nombres de roles estén en minúsculas para comparaciones consistentes
    return (data || []).map((role: string) => role.toLowerCase())
  } catch (error) {
    console.error("❌ [getUserRoles] Error inesperado en getUserRoles:", error)
    return []
  }
})

// Función para obtener los permisos del usuario actual (lado del servidor)
export const getUserPermissions = cache(async () => {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return []
  }

  try {
    // Usar una consulta SQL directa para evitar las políticas RLS
    const { data, error } = await supabase.rpc("get_user_permission_names", {
      user_id_param: session.user.id,
    })

    if (error) {
      console.error("Error fetching permissions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserPermissions:", error)
    return []
  }
})

// Función para verificar si el usuario tiene un permiso específico (lado del cliente)
export async function hasPermission(permissionName: string): Promise<boolean> {
  const supabase = createClientComponentClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  try {
    // Usar una función RPC para verificar el permiso
    const { data, error } = await supabase.rpc("user_has_permission", {
      user_id_param: user.id,
      permission_name_param: permissionName,
    })

    if (error) {
      console.error("Error checking permission:", error)
      return false
    }

    return data || false
  } catch (error) {
    console.error("Error in hasPermission:", error)
    return false
  }
}

// Función para verificar si el usuario tiene un rol específico (lado del cliente)
export async function hasRole(roleName: string): Promise<boolean> {
  const supabase = createClientComponentClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  try {
    // Usar una función RPC para verificar el rol
    const { data, error } = await supabase.rpc("user_has_role", {
      user_id_param: user.id,
      role_name_param: roleName.toLowerCase(), // Convertir a minúsculas para comparación consistente
    })

    if (error) {
      console.error("Error checking role:", error)
      return false
    }

    return data || false
  } catch (error) {
    console.error("Error in hasRole:", error)
    return false
  }
}

// Function to check if the user has a specific role (server-side)
export async function checkUserRole(supabase: any, roleName: string): Promise<boolean> {
  try {
    const roles = await getUserRoles()
    return roles.includes(roleName)
  } catch (error) {
    console.error("Error checking user role:", error)
    return false
  }
}

// Añadir función para verificar si el usuario es administrador (cualquier tipo)
export async function isUserAdmin(): Promise<boolean> {
  try {
    console.log("⚙️ [isUserAdmin] Verificando si el usuario es administrador...")
    const roles = await getUserRoles()
    console.log("✅ [isUserAdmin] Roles obtenidos para verificación de admin:", roles)
    
    // Verificar cualquier rol de administrador (considerando mayúsculas/minúsculas)
    const isAdmin = roles.some((role) => {
      const lowerRole = role.toLowerCase()
      return lowerRole === "admin" || 
             lowerRole === "administrador" || 
             lowerRole === "administración" ||
             lowerRole.includes("admin")
    })
    
    console.log("🛡️ [isUserAdmin] Resultado de verificación de admin:", isAdmin)
    return isAdmin
  } catch (error) {
    console.error("❌ [isUserAdmin] Error inesperado al verificar si es admin:", error)
    return false
  }
}

// Función para verificar si el usuario es supervisor o director
export async function isUserSupervisorOrDirector(): Promise<boolean> {
  try {
    console.log("⚙️ [isUserSupervisorOrDirector] Verificando si el usuario es supervisor o director...")
    const roles = await getUserRoles()
    console.log("✅ [isUserSupervisorOrDirector] Roles obtenidos:", roles)
    
    // Verificar roles de supervisión (considerando mayúsculas/minúsculas)
    const isSupervisorOrDirector = roles.some((role) => {
      const lowerRole = role.toLowerCase()
      return lowerRole === "supervisor" || 
             lowerRole === "director" ||
             lowerRole.includes("supervisor") ||
             lowerRole.includes("director")
    })
    
    console.log("🛡️ [isUserSupervisorOrDirector] Resultado:", isSupervisorOrDirector)
    return isSupervisorOrDirector
  } catch (error) {
    console.error("❌ [isUserSupervisorOrDirector] Error inesperado:", error)
    return false
  }
}

// Función para verificar si el usuario puede editar (admin, supervisor, director)
export async function canUserEdit(): Promise<boolean> {
  try {
    const isAdmin = await isUserAdmin()
    const isSupervisorOrDirector = await isUserSupervisorOrDirector()
    
    return isAdmin || isSupervisorOrDirector
  } catch (error) {
    console.error("❌ [canUserEdit] Error inesperado:", error)
    return false
  }
}

// Añadir función para obtener los roles del usuario actual (lado del cliente)
export async function getUserRolesClient(): Promise<string[]> {
  const supabase = createClientComponentClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return []
  }

  try {
    // Usar una consulta SQL directa para evitar las políticas RLS
    const { data, error } = await supabase.rpc("get_user_role_names", {
      user_id_param: user.id,
    })

    if (error) {
      console.error("Error fetching roles:", error)
      return []
    }

    // Asegurarse de que todos los nombres de roles estén en minúsculas para comparaciones consistentes
    return (data || []).map((role: string) => role.toLowerCase())
  } catch (error) {
    console.error("Error in getUserRolesClient:", error)
    return []
  }
}

/**
 * Devuelve el primer rol del usuario actual.
 * Si el usuario no tiene roles, devuelve null.
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const roles = await getUserRoles()
    return roles.length ? roles[0] : null
  } catch (error) {
    console.error("❌ [getUserRole] Error inesperado:", error)
    return null
  }
}
