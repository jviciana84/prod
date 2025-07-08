import type { Metadata } from "next"
import DirectoryPage from "@/components/directory/directory-page"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export const metadata: Metadata = {
  title: "Directorio de Usuarios | CVO",
  description: "Directorio de todos los usuarios de la aplicación CVO",
}

export default function Directory() {
  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <Breadcrumbs className="mt-4" />
        <div className="flex items-center gap-3">
          {/* Puedes poner aquí el icono y título que desees para la sección Directory */}
          <span className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">D</span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Directorio</h1>
            <p className="text-muted-foreground">Gestión de usuarios y contactos</p>
          </div>
        </div>
      </div>
      <DirectoryPage />
    </div>
  )
}
