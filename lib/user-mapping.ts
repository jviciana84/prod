import { createClientComponentClient } from "@/lib/supabase/client"

export interface UserAsesorMapping {
  id: string
  user_id: string
  profile_name: string
  asesor_name: string
  email: string
  active: boolean
}

export async function getUserAsesorName(userId: string, profileName: string, email: string): Promise<string | null> {
  const supabase = createClientComponentClient()

  try {
    // Primero intentar obtener el mapeo de la tabla
    const { data: mapping, error: mappingError } = await supabase
      .from("user_asesor_mapping")
      .select("asesor_name")
      .eq("user_id", userId)
      .eq("active", true)
      .single()

    if (mapping && !mappingError) {
      console.log("✅ Mapeo encontrado:", mapping.asesor_name)
      return mapping.asesor_name
    }

    // Si no hay mapeo, intentar buscar por email en la tabla entregas
    const { data: entregasByEmail, error: emailError } = await supabase
      .from("entregas")
      .select("asesor")
      .ilike("asesor", `%${email.split("@")[0]}%`)
      .limit(1)

    if (entregasByEmail && entregasByEmail.length > 0 && !emailError) {
      console.log("✅ Asesor encontrado por email:", entregasByEmail[0].asesor)
      return entregasByEmail[0].asesor
    }

    // Mapeo manual para casos conocidos
    const manualMappings: Record<string, string> = {
      JordiVi: "Jordi Viciana",
      "jordi.viciana@munichgroup.es": "Jordi Viciana",
      // Añadir más mapeos según sea necesario
    }

    if (manualMappings[profileName]) {
      console.log("✅ Mapeo manual encontrado:", manualMappings[profileName])
      return manualMappings[profileName]
    }

    if (manualMappings[email]) {
      console.log("✅ Mapeo manual por email encontrado:", manualMappings[email])
      return manualMappings[email]
    }

    // Como último recurso, buscar nombres similares
    const { data: similarNames, error: similarError } = await supabase
      .from("entregas")
      .select("asesor")
      .or(`asesor.ilike.%${profileName}%,asesor.ilike.%${profileName.toLowerCase()}%`)
      .limit(5)

    if (similarNames && similarNames.length > 0 && !similarError) {
      console.log(
        "⚠️ Nombres similares encontrados:",
        similarNames.map((s) => s.asesor),
      )
      // Retornar el más común
      const counts = similarNames.reduce(
        (acc, curr) => {
          acc[curr.asesor] = (acc[curr.asesor] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const mostCommon = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]
      if (mostCommon) {
        console.log("✅ Nombre más común seleccionado:", mostCommon[0])
        return mostCommon[0]
      }
    }

    console.log("❌ No se pudo encontrar mapeo para:", { userId, profileName, email })
    return null
  } catch (error) {
    console.error("❌ Error en getUserAsesorName:", error)
    return null
  }
}

export async function createUserAsesorMapping(
  userId: string,
  profileName: string,
  asesorName: string,
  email: string,
): Promise<boolean> {
  const supabase = createClientComponentClient()

  try {
    const { error } = await supabase.from("user_asesor_mapping").upsert({
      user_id: userId,
      profile_name: profileName,
      asesor_name: asesorName,
      email: email,
      active: true,
    })

    if (error) {
      console.error("❌ Error creando mapeo:", error)
      return false
    }

    console.log("✅ Mapeo creado exitosamente")
    return true
  } catch (error) {
    console.error("❌ Error inesperado creando mapeo:", error)
    return false
  }
}
