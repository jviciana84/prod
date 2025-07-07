import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { getUserRoles } from "@/lib/auth/permissions"
import UserManagement from "@/components/admin/user-management"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export default async function UsersPage() {
  const cookieStore = await cookies()
  const supabase = await createServerClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const roles = await getUserRoles()

  if (!roles.includes("admin")) {
    redirect("/dashboard")
  }

  return (
    <>
      <Breadcrumbs />
      <UserManagement />
    </>
  )
}
