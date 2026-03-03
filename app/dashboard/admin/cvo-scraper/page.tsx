import { redirect } from "next/navigation"
import { getUserRoles } from "@/lib/auth/permissions"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Info } from "lucide-react"

const CVO_SCRAPER_BUNDLE = {
  id: "cvo-scraper-bundle",
  fileKey: "cvo-scraper-v1.2.5-bundle",
  title: "CVO Scraper v1.2.5 - Paquete ZIP",
  description:
    "ZIP con el ejecutable del CVO Scraper y los recursos básicos (icono). Si añades chromedriver.exe al proyecto también se incluirá automáticamente.",
}

export default async function CvoScraperDownloadsPage() {
  const roles = await getUserRoles()

  if (
    !roles.includes("admin") &&
    !roles.includes("administrador") &&
    !roles.includes("administración")
  ) {
    redirect("/dashboard")
  }

  return (
    <div className="container py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Administración", href: "/dashboard/admin" },
          { label: "CVO Scraper", href: "/dashboard/admin/cvo-scraper" },
        ]}
      />

      <div className="flex items-center gap-3">
        <Download className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CVO Scraper - Descarga</h1>
          <p className="text-muted-foreground">
            Descarga un ZIP con todo lo necesario para desplegar el CVO Scraper en los equipos de
            taller.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paquete CVO Scraper</CardTitle>
          <CardDescription>
            Se descargará un único archivo ZIP con el ejecutable y recursos básicos del scraper.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-card/50 p-4 shadow-sm">
            <div>
              <p className="font-semibold">{CVO_SCRAPER_BUNDLE.title}</p>
              <p className="text-sm text-muted-foreground">{CVO_SCRAPER_BUNDLE.description}</p>
            </div>
            <Button asChild size="sm" variant="default">
              <a
                href={`/api/cvo-scraper/download?file=${encodeURIComponent(
                  CVO_SCRAPER_BUNDLE.fileKey,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar ZIP
              </a>
            </Button>
          </div>

          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-medium">Contenido del ZIP</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  <strong>CVO_Scraper_v1.2.5.exe</strong> (carpeta raíz del ZIP)
                </li>
                <li>
                  <strong>icons/</strong> con el icono del scraper.
                </li>
                <li>
                  Si añades <strong>chromedriver.exe</strong> a <code>cvo-scraper-v1/</code>, también
                  se incluirá automáticamente en la raíz del ZIP.
                </li>
              </ul>
              <p>
                En el PC del taller debe estar instalado <strong>Chrome</strong>. Si no empaquetas
                ChromeDriver en el ZIP, deberá estar instalado en el sistema o en el PATH.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

