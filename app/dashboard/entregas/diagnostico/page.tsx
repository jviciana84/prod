import { createServerComponentClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Database, FileText, History } from "lucide-react"

export default async function DiagnosticoIncidenciasPage() {
  const supabase = await createServerComponentClient()

  // Obtener las últimas incidencias registradas
  const { data: historial, error: historialError } = await supabase
    .from("incidencias_historial")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(20)

  // Obtener las últimas entregas actualizadas
  const { data: entregas, error: entregasError } = await supabase
    .from("entregas")
    .select("id, matricula, modelo, tipos_incidencia, incidencia, fecha_venta")
    .order("fecha_venta", { ascending: false })
    .limit(10)

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: es })
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs
        segments={[
          {
            title: "Dashboard",
            href: "/dashboard",
          },
          {
            title: "Entregas",
            href: "/dashboard/entregas",
          },
          {
            title: "Diagnóstico de Incidencias",
            href: "/dashboard/entregas/diagnostico",
          },
        ]}
      />

      <div className="flex items-center gap-2">
        <Database className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Diagnóstico de Incidencias</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Historial de incidencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Últimas acciones en el historial
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historialError ? (
              <div className="text-red-500">Error al cargar el historial: {historialError.message}</div>
            ) : !historial || historial.length === 0 ? (
              <div className="text-muted-foreground">No se encontraron registros en el historial</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{formatDate(item.fecha)}</TableCell>
                      <TableCell>{item.tipo_incidencia}</TableCell>
                      <TableCell>
                        <span
                          className={
                            item.accion === "añadida"
                              ? "text-green-600 dark:text-green-400"
                              : item.accion === "eliminada"
                                ? "text-red-600 dark:text-red-400"
                                : "text-blue-600 dark:text-blue-400"
                          }
                        >
                          {item.accion}
                        </span>
                      </TableCell>
                      <TableCell>{item.usuario_nombre}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Entregas con incidencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Entregas con incidencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entregasError ? (
              <div className="text-red-500">Error al cargar las entregas: {entregasError.message}</div>
            ) : !entregas || entregas.length === 0 ? (
              <div className="text-muted-foreground">No se encontraron entregas</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Incidencias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entregas.map((entrega) => (
                    <TableRow key={entrega.id}>
                      <TableCell>{entrega.matricula}</TableCell>
                      <TableCell>{entrega.modelo}</TableCell>
                      <TableCell>
                        {entrega.incidencia ? (
                          <div className="flex flex-wrap gap-1">
                            {entrega.tipos_incidencia && entrega.tipos_incidencia.length > 0 ? (
                              entrega.tipos_incidencia.map((tipo) => (
                                <span
                                  key={tipo}
                                  className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 px-2 py-1 rounded text-xs"
                                >
                                  {tipo}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Incidencia sin tipo</span>
                            )}
                          </div>
                        ) : (
                          <span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-2 py-1 rounded text-xs">
                            Sin incidencias
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
