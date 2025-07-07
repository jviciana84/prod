import { createClientComponentClient } from "@/lib/supabase/client"

export async function detectAndSuggestMapping(userId: string, profileName: string, email: string) {
  const supabase = createClientComponentClient()

  try {
    // Verificar si ya existe un mapeo para este usuario
    const { data: existingMapping } = await supabase
      .from("user_asesor_mapping")
      .select("id")
      .eq("user_id", userId)
      .eq("active", true)
      .single()

    if (existingMapping) {
      return null // Ya tiene mapeo
    }

    // Obtener todos los asesores de entregas
    const { data: entregasData } = await supabase
      .from("entregas")
      .select("asesor")
      .not("asesor", "is", null)
      .neq("asesor", "")

    if (!entregasData) return null

    // Contar entregas por asesor
    const asesorCounts: Record<string, number> = {}
    entregasData.forEach((item: any) => {
      if (item.asesor) {
        asesorCounts[item.asesor] = (asesorCounts[item.asesor] || 0) + 1
      }
    })

    // Buscar coincidencias
    const suggestions = []
    const nameLower = profileName.toLowerCase()

    for (const [asesor, count] of Object.entries(asesorCounts)) {
      let confidence = 0
      let reason = ""

      // Coincidencias específicas conocidas
      if (nameLower.includes("jordi") && asesor === "JordiVi") {
        confidence = 0.95
        reason = "Coincidencia específica: Jordi -> JordiVi"
      } else if (nameLower.includes("sara") && asesor === "SaraMe") {
        confidence = 0.95
        reason = "Coincidencia específica: Sara -> SaraMe"
      } else if (nameLower.includes("javier") && asesor === "JavierCa") {
        confidence = 0.95
        reason = "Coincidencia específica: Javier -> JavierCa"
      }
      // Coincidencias por patrón de nombre
      else if (asesor.length >= 6) {
        const words = nameLower.split(" ")
        if (words.length >= 2) {
          const firstName = words[0]
          const lastName = words[1]
          
          // Patrón: PrimerNombre + Primeras letras del apellido
          const expectedPattern = firstName + lastName.substring(0, 2)
          if (asesor.toLowerCase() === expectedPattern.toLowerCase()) {
            confidence = 0.8
            reason = "Coincidencia por patrón de nombre"
          }
        }
      }

      if (confidence > 0.7) {
        suggestions.push({
          asesor,
          confidence,
          reason,
          entregas_count: count,
        })
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  } catch (error) {
    console.error("Error detecting mapping:", error)
    return null
  }
}

export async function createAutoMapping(userId: string, profileName: string, asesorAlias: string, email: string) {
  const supabase = createClientComponentClient()

  try {
    const { error } = await supabase.from("user_asesor_mapping").insert({
      user_id: userId,
      profile_name: profileName,
      asesor_alias: asesorAlias,
      email: email,
      active: true,
    })

    if (error) {
      console.error("Error creating auto mapping:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error creating auto mapping:", error)
    return false
  }
}
