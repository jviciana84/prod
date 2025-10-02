import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseClient"

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
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
    const { error: profileError } = await supabaseAdmin.from("profiles").update(updateData).eq("id", params.userId)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return NextResponse.json({ message: profileError.message }, { status: 500 })
    }

    // Si se proporcionó un roleId, actualizar también la tabla user_roles
    if (roleId) {
      console.log("🔄 Actualizando tabla user_roles para usuario:", params.userId, "con roleId:", roleId)
      
      // Primero eliminar todos los roles existentes del usuario
      const { error: deleteError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", params.userId)

      if (deleteError) {
        console.error("Error al eliminar roles existentes:", deleteError)
        return NextResponse.json({ message: deleteError.message }, { status: 500 })
      }

      // Luego asignar el nuevo rol
      const { error: insertError } = await supabaseAdmin.from("user_roles").insert({
        user_id: params.userId,
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

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
  try {
    console.log("🗑️ Eliminando usuario:", params.userId)

    // PASO 1: Eliminar de la tabla user_roles
    console.log("🔄 Eliminando roles del usuario...")
    const { error: userRolesError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", params.userId)

    if (userRolesError) {
      console.error("Error al eliminar roles del usuario:", userRolesError)
      return NextResponse.json({ message: userRolesError.message }, { status: 500 })
    }

    // PASO 2: Eliminar de la tabla profiles
    console.log("🔄 Eliminando perfil del usuario...")
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", params.userId)

    if (profileError) {
      console.error("Error al eliminar perfil:", profileError)
      return NextResponse.json({ message: profileError.message }, { status: 500 })
    }

    // PASO 3: Eliminar de auth.users
    console.log("🔄 Eliminando usuario de auth.users...")
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(params.userId)

    if (authError) {
      console.error("Error al eliminar usuario de auth:", authError)
      return NextResponse.json({ message: authError.message }, { status: 500 })
    }

    console.log("✅ Usuario eliminado exitosamente")
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 })
  }
}