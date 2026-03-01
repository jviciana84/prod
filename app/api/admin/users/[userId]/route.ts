import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase con permisos de administrador
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolved = await Promise.resolve(context.params)
    const userId = typeof resolved === "object" && resolved !== null && "userId" in resolved ? resolved.userId : ""
    if (!userId) {
      return NextResponse.json({ message: "userId es requerido" }, { status: 400 })
    }
    const body = await request.json()
    const { fullName, alias, phone, position, avatarUrl, roleId } = body

    console.log("📝 Datos recibidos para actualización:", { fullName, alias, phone, position, avatarUrl, roleId })

    // Obtener el nombre del rol si se proporcionó roleId
    let roleName = null
    if (roleId) {
      try {
        const { data: roleData } = await supabaseAdmin.from("roles").select("name").eq("id", roleId).single()

        roleName = roleData?.name || null
        console.log("📝 Rol convertido:", { roleId, roleName })
      } catch (error) {
        console.error("Error fetching role name:", error)
      }
    }

    const updateData = {
      full_name: fullName,
      alias: alias,
      phone: phone,
      position: position,
      avatar_url: avatarUrl,
      ...(roleName && { role: roleName }),
    }

    console.log("📝 Datos que se van a actualizar en profiles:", updateData)

    // Actualizar la tabla profiles
    const { error: profileError } = await supabaseAdmin.from("profiles").update(updateData).eq("id", userId)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return NextResponse.json({ message: profileError.message }, { status: 500 })
    }

    // Si se proporcionó un roleId, actualizar también la tabla user_roles
    if (roleId) {
      console.log("🔄 Actualizando tabla user_roles para usuario:", userId, "con roleId:", roleId)
      
      // Primero eliminar todos los roles existentes del usuario
      const { error: deleteError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId)

      if (deleteError) {
        console.error("Error al eliminar roles existentes:", deleteError)
        return NextResponse.json({ message: deleteError.message }, { status: 500 })
      }

      // Luego asignar el nuevo rol
      const { error: insertError } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role_id: roleId,
      })

      if (insertError) {
        console.error("Error al asignar nuevo rol:", insertError)
        return NextResponse.json({ message: insertError.message }, { status: 500 })
      }

      console.log("✅ Tabla user_roles actualizada exitosamente")
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context?: { params?: Promise<{ userId: string }> | { userId: string } }) {
  try {
    return await handleDelete(request, context)
  } catch (e: any) {
    const safeMessage = e?.message ?? (e && String(e)) ?? "Error inesperado en DELETE"
    return NextResponse.json({ message: safeMessage }, { status: 500 })
  }
}

async function handleDelete(request: Request, context?: { params?: Promise<{ userId: string }> | { userId: string } }) {
  // Obtener userId desde la URL (más fiable que context.params en Next 15)
  let userId: string | null = null
  try {
    const pathname = new URL(request.url).pathname
    const parts = pathname.split("/").filter(Boolean)
    const maybeId = parts[parts.length - 1]
    if (maybeId && /^[0-9a-f-]{36}$/i.test(maybeId)) userId = maybeId
  } catch {
    // ignore
  }
  if (!userId && context?.params != null) {
    const resolved = await Promise.resolve(context.params)
    userId = typeof resolved === "object" && resolved !== null && "userId" in resolved ? resolved.userId : null
  }
  if (!userId) {
    return NextResponse.json({ message: "userId es requerido" }, { status: 400 })
  }
  console.log("🗑️ Eliminando usuario:", userId)

    // Limpiar tablas que referencian al usuario (best-effort: si falla una, seguimos con el resto)
    const cleanupSteps: { name: string; run: () => Promise<{ error: unknown } | null> } = [
      {
        name: "user_roles",
        run: async () => {
          const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId)
          return error ? { error } : null
        },
      },
      {
        name: "user_asesor_mapping",
        run: async () => {
          const { error } = await supabaseAdmin.from("user_asesor_mapping").delete().eq("user_id", userId)
          return error ? { error } : null
        },
      },
      {
        name: "user_preferences",
        run: async () => {
          const { error } = await supabaseAdmin.from("user_preferences").delete().eq("user_id", userId)
          return error ? { error } : null
        },
      },
      {
        name: "user_forced_updates",
        run: async () => {
          const { error } = await supabaseAdmin.from("user_forced_updates").delete().eq("user_id", userId)
          return error ? { error } : null
        },
      },
      {
        name: "ai_conversations",
        run: async () => {
          try {
            const { data: sessions } = await supabaseAdmin.from("ai_sessions").select("id").eq("user_id", userId)
            const sessionIds = (sessions || []).map((s) => s.id)
            if (sessionIds.length === 0) return null
            const { error } = await supabaseAdmin.from("ai_conversations").delete().in("session_id", sessionIds)
            return error ? { error } : null
          } catch {
            return null
          }
        },
      },
      {
        name: "ai_sessions",
        run: async () => {
          const { error } = await supabaseAdmin.from("ai_sessions").delete().eq("user_id", userId)
          return error ? { error } : null
        },
      },
    ]

    for (const step of cleanupSteps) {
      try {
        const result = await step.run()
        if (result?.error) {
          console.warn(`⚠️ Limpieza ${step.name} (continuando):`, (result.error as { message?: string })?.message)
        }
      } catch (e) {
        console.warn(`⚠️ Limpieza ${step.name} ignorada:`, e)
      }
    }

    // 1) Eliminar de Auth PRIMERO (así el usuario ya no puede entrar aunque falle algo después)
    let authError: { message?: string } | null = null
    try {
      const result = await supabaseAdmin.auth.admin.deleteUser(userId)
      authError = result.error
    } catch (authThrow: any) {
      console.error("auth.admin.deleteUser lanzó excepción:", authThrow)
      return NextResponse.json(
        { message: authThrow?.message || "Error al eliminar usuario de Auth" },
        { status: 500 }
      )
    }
    if (authError) {
      const msg = authError.message || ""
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("user not found")) {
        console.log("Usuario ya no existía en Auth, eliminación considerada correcta")
      } else {
        console.error("Error al eliminar usuario de auth:", authError)
        return NextResponse.json(
          { message: msg || "No se pudo eliminar el usuario de la autenticación" },
          { status: 500 }
        )
      }
    }

    // 2) Eliminar perfil (best-effort: ya no hay usuario en Auth)
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)
    if (profileError) {
      console.warn("⚠️ Borrado de perfil (ignorado):", profileError.message)
    }

  console.log("✅ Usuario eliminado exitosamente")
  return NextResponse.json({ message: "User deleted successfully" })
}