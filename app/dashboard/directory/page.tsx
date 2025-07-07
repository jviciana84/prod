import type { Metadata } from "next"
import DirectoryPage from "@/components/directory/directory-page"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export const metadata: Metadata = {
  title: "Directorio de Usuarios | CVO",
  description: "Directorio de todos los usuarios de la aplicación CVO",
}

export default function Directory() {
  return (
    <div className="container mx-auto py-6">
      <Breadcrumbs />
      {/* Eliminamos el título duplicado que estaba aquí */}
      <DirectoryPage />
    </div>
  )
}
