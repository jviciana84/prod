import type { Metadata } from "next"
import { getUserRole } from "@/lib/auth/permissions"
import { getUserAdvisorName } from "@/lib/user-mapping-improved"
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
  const userAdvisorName = await getUserAdvisorName()

  return <IncentivosPageClient searchParams={searchParams} userRole={userRole} userAdvisorName={userAdvisorName} />
}
