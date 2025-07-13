import { Loader2 } from "lucide-react"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export default function LoadingPage() {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Gestión de Llaves", href: "/dashboard/llaves" },
    { label: "Historial Completo" },
  ]

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-4 text-lg text-muted-foreground">Cargando historial...</span>
      </div>
    </div>
  )
}
