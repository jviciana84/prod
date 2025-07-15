import { createClientComponentClient } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

export interface UserAsesorMapping {
  id: string
  user_id: string
  profile_name: string
  asesor_alias: string
  email: string
  active: boolean
}

export async function getUserAsesorAlias(userId: string, profileName: string, email: string): Promise<string | null> {
  const supabase = createClientComponentClient<Database>()

  try {
    console.log("🔍 Buscando mapeo para:", { userId, profileName, email })

    // 1. PRIMERO: Buscar el alias directamente en la tabla profiles del usuario
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", userId)
      .single()

    if (profileData && profileData.alias && !profileError) {
      console.log("✅ Alias encontrado en profiles:", profileData.alias)
      return profileData.alias
    } else if (profileError) {
      console.warn("⚠️ Error al obtener alias de profiles (puede que no exista):", profileError.message)
    }

    // 2. SEGUNDO: Buscar en la tabla de mapeo por user_id (MÁS CONFIABLE)
    const { data: mapping, error: mappingError } = await supabase
      .from("user_asesor_mapping")
      .select("asesor_alias")
      .eq("user_id", userId)
      .eq("active", true)
      .single()

    if (mapping && !mappingError) {
      console.log("✅ Mapeo encontrado por user_id en user_asesor_mapping:", mapping.asesor_alias)
      return mapping.asesor_alias
    } else if (mappingError) {
      console.warn("⚠️ Error al obtener mapeo por user_id:", mappingError.message)
    }

    // 3. TERCERO: Buscar por email exacto en user_asesor_mapping
    const { data: emailMapping, error: emailMappingError } = await supabase
      .from("user_asesor_mapping")
      .select("asesor_alias")
      .eq("email", email)
      .eq("active", true)
      .single()

    if (emailMapping && !emailMappingError) {
      console.log("✅ Mapeo encontrado por email en user_asesor_mapping:", emailMapping.asesor_alias)
      return emailMapping.asesor_alias
    } else if (emailMappingError) {
      console.warn("⚠️ Error al obtener mapeo por email:", emailMappingError.message)
    }

    // 4. CUARTO: MAPEO HARDCODEADO CORRECTO (BACKUP)
    const correctMappings: Record<string, string> = {
      "jordi.viciana@munichgroup.es": "JordiVi",
      "viciana84@gmail.com": "RCDE",
      "Jordi Viciana Sánchez": "JordiVi",
      // Puedes añadir más mapeos hardcodeados aquí si es necesario
    }

    // Buscar por email
    if (correctMappings[email]) {
      console.log("✅ Mapeo hardcodeado por email:", correctMappings[email])
      return correctMappings[email]
    }

    // Buscar por nombre
    if (correctMappings[profileName]) {
      console.log("✅ Mapeo hardcodeado por nombre:", correctMappings[profileName])
      return correctMappings[profileName]
    }

    console.log("❌ No se encontró mapeo para:", { userId, profileName, email })
    return null
  } catch (error) {
    console.error("❌ Error en getUserAsesorAlias:", error)
    return null
  }
}

// 🔽 Añadir justo debajo de getUserAsesorAlias(...)
/**
 * Alias legible en inglés que envuelve a getUserAsesorAlias.
 * Se mantiene la misma firma para compatibilidad con el resto del código.
 */
export async function getUserAdvisorName(userId: string, profileName: string, email: string): Promise<string | null> {
  return getUserAsesorAlias(userId, profileName, email)
}

/**
 * Obtiene el ID de usuario (UUID) de la tabla profiles a partir de un alias de asesor.
 * Intenta buscar por alias directo, luego por nombre completo (primera palabra del alias),
 * y finalmente en la tabla user_asesor_mapping.
 */
export async function getUserIdByAsesorAlias(asesorAlias: string): Promise<string | null> {
  const supabase = createClientComponentClient<Database>()

  try {
    console.log("🔍 Buscando ID de usuario para alias:", asesorAlias)

    // 1. Intentar encontrar por alias directamente en profiles
    const { data: profileByAlias, error: profileByAliasError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("alias", asesorAlias)
      .single()

    if (profileByAlias && !profileByAliasError) {
      console.log("✅ ID encontrado en profiles por alias:", profileByAlias.id)
      return profileByAlias.id
    } else if (profileByAliasError) {
      console.warn("⚠️ Error al buscar ID por alias en profiles:", profileByAliasError.message)
    }

    // 2. Fallback: intentar encontrar por full_name (primera palabra del alias)
    // Esto es útil si el alias es el nombre completo o parte de él
    const firstWordOfAlias = asesorAlias.split(" ")[0]
    if (firstWordOfAlias) {
      const { data: profileByName, error: profileByNameError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("full_name", `${firstWordOfAlias}%`) // Coincidencia parcial al inicio
        .limit(1)
        .single()

      if (profileByName && !profileByNameError) {
        console.log("✅ ID encontrado en profiles por nombre (parcial):", profileByName.id)
        return profileByName.id
      } else if (profileByNameError) {
        console.warn("⚠️ Error al buscar ID por nombre (parcial) en profiles:", profileByNameError.message)
      }
    }

    // 3. Fallback: buscar en la tabla user_asesor_mapping
    const { data: mapping, error: mappingError } = await supabase
      .from("user_asesor_mapping")
      .select("user_id")
      .ilike("asesor_alias", asesorAlias)
      .eq("active", true)
      .single()

    if (mapping && !mappingError) {
      console.log("✅ ID encontrado en user_asesor_mapping:", mapping.user_id)
      return mapping.user_id
    } else if (mappingError) {
      console.warn("⚠️ Error al buscar ID en user_asesor_mapping:", mappingError.message)
    }

    console.log("❌ No se encontró ID de usuario para el alias:", asesorAlias)
    return null
  } catch (error) {
    console.error("❌ Error en getUserIdByAsesorAlias:", error)
    return null
  }
}

export async function getAllAsesorAliases(): Promise<string[]> {
  const supabase = createClientComponentClient<Database>()

  try {
    // Obtener asesores de entregas
    const { data: entregas, error: entregasError } = await supabase
      .from("entregas")
      .select("asesor")
      .not("asesor", "is", null)
      .neq("asesor", "")

    if (entregasError) throw entregasError

    // Obtener asesores de sales_vehicles
    const { data: sales, error: salesError } = await supabase
      .from("sales_vehicles")
      .select("asesor")
      .not("asesor", "is", null)
      .neq("asesor", "")

    if (salesError) throw salesError

    // Obtener asesores de stock
    const { data: stock, error: stockError } = await supabase
      .from("stock")
      .select("asesor")
      .not("asesor", "is", null)
      .neq("asesor", "")

    if (stockError) throw stockError

    const allAsesores = new Set<string>()
    entregas.forEach((item) => item.asesor && allAsesores.add(item.asesor))
    sales.forEach((item) => item.asesor && allAsesores.add(item.asesor))
    stock.forEach((item) => item.asesor && allAsesores.add(item.asesor))

    // Asesores comunes predefinidos (para asegurar que siempre estén disponibles)
    const commonAsesores = [
      "JordiVi",
      "SaraMe",
      "RCDE",
      "CarlosR",
      "AnaG",
      "PedroL",
      "MariaS",
      "DavidM",
      "LauraP",
      "RobertoF",
    ]
    commonAsesores.forEach((asesor) => allAsesores.add(asesor))

    return Array.from(allAsesores).sort()
  } catch (error) {
    console.error("Error obteniendo aliases de asesores:", error)
    return []
  }
}
