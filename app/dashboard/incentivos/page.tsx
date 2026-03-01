import type { Metadata } from "next"
import { getUserRole } from "@/lib/auth/permissions"
import { getUserAdvisorName } from "@/lib/user-mapping-improved"
import { createServerClient } from "@/lib/supabase/server"
import IncentivosPageClient from "./incentivos-page-client"

export const metadata: Metadata = {
  title: "Incentivos | Dashboard",
  description: "Gestión de incentivos del sistema",
}

export const dynamic = "force-dynamic"

export default async function IncentivosPage({
  searchParams,
}: {
  searchParams?: { matricula?: string; ort?: string }
}) {
  const userRole = await getUserRole()
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userAdvisorName = user
    ? await getUserAdvisorName(user.id, user.user_metadata?.full_name ?? "", user.email ?? "")
    : null

  return <IncentivosPageClient searchParams={searchParams} userRole={userRole} userAdvisorName={userAdvisorName} />
}
