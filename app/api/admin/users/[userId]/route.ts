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

    console.log("📝 Datos que se van a actualizar:", updateData)

    const { error } = await supabaseAdmin.from("profiles").update(updateData).eq("id", params.userId)

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 })
  }
}
