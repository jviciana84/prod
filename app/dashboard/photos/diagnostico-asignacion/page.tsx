import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Diagnóstico Asignación Fotográfica | Dashboard",
  description: "Diagnóstico del sistema de asignación automática de fotografías",
}

async function getDiagnosticData() {
  const supabase = createClient()

  try {
    // Verificar vehículo específico 7766MNB
    const { data: vehiculo7766, error: errorVehiculo } = await supabase
      .from("fotos")
      .select("*")
      .eq("matricula", "7766MNB")
      .single()

    // Obtener últimos vehículos sin fotógrafo asignado
    const { data: sinFotografo, error: errorSinFotografo } = await supabase
      .from("fotos")
      .select("*")
      .is("fotografo_asignado", null)
      .order("created_at", { ascending: false })
      .limit(10)

    // Verificar configuración de asignación automática
    const { data: fotosConfig, error: errorConfig } = await supabase
      .from("fotos")
      .select("matricula, fotografo_asignado, created_at")
      .order("created_at", { ascending: false })
      .limit(20)

    // Obtener estadísticas de fotógrafos
    const { data: statsPhotographers, error: errorStats } = await supabase
      .from("fotos")
      .select("fotografo_asignado")
      .not("fotografo_asignado", "is", null)

    return {
      vehiculo7766: vehiculo7766 || null,
      errorVehiculo,
      sinFotografo: sinFotografo || [],
      errorSinFotografo,
      fotosConfig: fotosConfig || [],
      errorConfig,
      statsPhotographers: statsPhotographers || [],
      errorStats,
    }
  } catch (error) {
    console.error("Error en diagnóstico:", error)
    return {
      vehiculo7766: null,
      errorVehiculo: error,
      sinFotografo: [],
      errorSinFotografo: error,
      fotosConfig: [],
      errorConfig: error,
      statsPhotographers: [],
      errorStats: error,
    }
  }
}

export default async function DiagnosticoAsignacionPage() {
  const data = await getDiagnosticData()

  const photographerStats = data.statsPhotographers.reduce((acc: Record<string, number>, item) => {
    if (item.fotografo_asignado) {
      acc[item.fotografo_asignado] = (acc[item.fotografo_asignado] || 0) + 1
    }
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8">
      <div className="flex flex-col gap-4">
        <Breadcrumbs
          segments={[
            {
              title: "Dashboard",
              href: "/dashboard",
            },
            {
              title: "Fotografías",
              href: "/dashboard/photos",
            },
            {
              title: "Diagnóstico Asignación",
              href: "/dashboard/photos/diagnostico-asignacion",
            },
          ]}
        />
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Diagnóstico de Asignación Fotográfica</h1>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Estado del vehículo 7766MNB */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {data.vehiculo7766?.fotografo_asignado ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Estado del Vehículo 7766MNB
            </CardTitle>
            <CardDescription>Verificación específica del vehículo que reportaste</CardDescription>
          </CardHeader>
          <CardContent>
            {data.errorVehiculo ? (
              <div className="text-red-600">Error al consultar: {data.errorVehiculo.message}</div>
            ) : data.vehiculo7766 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Matrícula:</span>
                  <span>{data.vehiculo7766.matricula}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Fotógrafo asignado:</span>
                  {data.vehiculo7766.fotografo_asignado ? (
                    <Badge variant="default">{data.vehiculo7766.fotografo_asignado}</Badge>
                  ) : (
                    <Badge variant="destructive">Sin asignar</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Fecha de creación:</span>
                  <span>{new Date(data.vehiculo7766.created_at).toLocaleString()}</span>
                </div>
                {!data.vehiculo7766.fotografo_asignado && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">Este vehículo NO tiene fotógrafo asignado</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      Esto indica que el sistema de asignación automática no funcionó correctamente.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600">No se encontró el vehículo 7766MNB en la tabla de fotos</div>
            )}
          </CardContent>
        </Card>

        {/* Vehículos sin fotógrafo asignado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Últimos Vehículos Sin Fotógrafo Asignado
            </CardTitle>
            <CardDescription>Los 10 vehículos más recientes que no tienen fotógrafo asignado</CardDescription>
          </CardHeader>
          <CardContent>
            {data.errorSinFotografo ? (
              <div className="text-red-600">Error al consultar: {data.errorSinFotografo.message}</div>
            ) : data.sinFotografo.length > 0 ? (
              <div className="space-y-2">
                {data.sinFotografo.map((foto, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{foto.matricula}</span>
                      <span className="text-sm text-gray-500">{new Date(foto.created_at).toLocaleString()}</span>
                    </div>
                    <Badge variant="destructive">Sin asignar</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                ¡Excelente! Todos los vehículos recientes tienen fotógrafo asignado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas de fotógrafos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Asignaciones por Fotógrafo</CardTitle>
            <CardDescription>Estadísticas de cuántos vehículos tiene asignado cada fotógrafo</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(photographerStats).length > 0 ? (
              <div className="grid gap-2">
                {Object.entries(photographerStats).map(([photographer, count]) => (
                  <div key={photographer} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{photographer}</span>
                    <Badge variant="outline">{count} vehículos</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">No se encontraron fotógrafos con asignaciones</div>
            )}
          </CardContent>
        </Card>

        {/* Acciones de diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones de Diagnóstico</CardTitle>
            <CardDescription>Herramientas para investigar y solucionar problemas de asignación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/photos/test" passHref>
              <Button variant="outline" className="w-full justify-start">
                <Camera className="h-4 w-4 mr-2" />
                Probar Asignación Automática
              </Button>
            </Link>
            <Link href="/dashboard/photos/assignment" passHref>
              <Button variant="outline" className="w-full justify-start">
                <Camera className="h-4 w-4 mr-2" />
                Gestión Manual de Asignaciones
              </Button>
            </Link>
            <Link href="/dashboard/photos/diagnostico" passHref>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Diagnóstico General del Sistema
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
