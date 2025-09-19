import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import ProfileForm from "@/components/profile/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"
import { User } from "lucide-react"

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" segments={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Perfil", href: "/dashboard/profile" },
          ]} />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Perfil de Usuario</h1>
            <p className="text-muted-foreground">Actualiza tu información personal</p>
          </div>
        </div>
      </div>
      <Card>
        <CardContent>
          <ProfileForm user={session.user} profile={profile} />
        </CardContent>
      </Card>
    </div>
  )
}
