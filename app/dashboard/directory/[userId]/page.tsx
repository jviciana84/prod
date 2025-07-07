import type { Metadata } from "next"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import UserProfile from "@/components/directory/user-profile"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

interface UserPageProps {
  params: {
    userId: string
  }
}

export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Obtener datos del usuario directamente de la tabla auth.users
  const { data: user, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      phone,
      position,
      created_at,
      updated_at
    `)
    .eq("id", params.userId)
    .single()

  if (error || !user) {
    return {
      title: "Usuario no encontrado | CVO",
      description: "El usuario solicitado no existe o no tienes permisos para verlo.",
    }
  }

  return {
    title: `${user.full_name || "Usuario"} | Directorio CVO`,
    description: `Perfil de ${user.full_name || user.email} en el directorio de CVO`,
  }
}

export default async function UserPage({ params }: UserPageProps) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Verificar si el usuario está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/")
  }

  // Obtener datos del usuario directamente de la tabla users
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      phone,
      position,
      created_at,
      updated_at
    `)
    .eq("id", params.userId)
    .single()

  if (userError || !user) {
    console.error("Error al obtener usuario:", userError)
    return notFound()
  }

  // Obtener roles del usuario
  const { data: userRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select(`
      roles (
        id,
        name,
        description
      )
    `)
    .eq("user_id", params.userId)

  if (rolesError) {
    console.error("Error al obtener roles:", rolesError)
  }

  // Formatear los datos del usuario con sus roles
  const userWithRoles = {
    ...user,
    roles: userRoles
      ? userRoles.map((ur) => ({
          id: ur.roles.id,
          name: ur.roles.name,
          description: ur.roles.description,
        }))
      : [],
  }

  return (
    <>
      <Breadcrumbs />
      <UserProfile user={userWithRoles} />
    </>
  )
}
