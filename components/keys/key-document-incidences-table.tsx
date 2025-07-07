"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, KeyRound, CreditCard, FileText, Car } from "lucide-react"
import type { IncidenciaHistorialConDetalles } from "@/types/incidencias"

interface KeyDocumentIncidencesTableProps {
  incidences: IncidenciaHistorialConDetalles[]
}

export function KeyDocumentIncidencesTable({ incidences }: KeyDocumentIncidencesTableProps) {
  const [selectedTab, setSelectedTab] = useState("all")

  // Filtrar incidencias por tipo
  const filteredIncidences = useMemo(() => {
    if (selectedTab === "all") return incidences
    if (selectedTab === "resolved") return incidences.filter((inc) => inc.resuelta)

    // Mapeo de tabs a tipos de incidencia exactos
    const typeMapping: Record<string, string> = {
      "segunda-llave": "2ª llave",
      "card-key": "CardKey",
      "ficha-tecnica": "Ficha técnica",
      "permiso-circulacion": "Permiso circulación",
    }

    const targetType = typeMapping[selectedTab]
    if (targetType) {
      return incidences.filter((inc) => inc.tipo_incidencia === targetType)
    }

    return incidences
  }, [incidences, selectedTab])

  // Contar incidencias por tipo
  const counts = useMemo(() => {
    const total = incidences.length
    const resolved = incidences.filter((inc) => inc.resuelta).length
    const segundaLlave = incidences.filter((inc) => inc.tipo_incidencia === "2ª llave").length
    const cardKey = incidences.filter((inc) => inc.tipo_incidencia === "CardKey").length
    const fichaTecnica = incidences.filter((inc) => inc.tipo_incidencia === "Ficha técnica").length
    const permisoCirculacion = incidences.filter((inc) => inc.tipo_incidencia === "Permiso circulación").length

    return {
      total,
      resolved,
      segundaLlave,
      cardKey,
      fichaTecnica,
      permisoCirculacion,
    }
  }, [incidences])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "N/A"
    }
  }

  const getStatusIcon = (resuelta: boolean) => {
    return resuelta ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "2ª llave":
        return <KeyRound className="h-4 w-4" />
      case "CardKey":
        return <CreditCard className="h-4 w-4" />
      case "Ficha técnica":
        return <FileText className="h-4 w-4" />
      case "Permiso circulación":
        return <Car className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Incidencias</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todas ({counts.total})</TabsTrigger>
            <TabsTrigger value="segunda-llave">2ª Llave ({counts.segundaLlave})</TabsTrigger>
            <TabsTrigger value="card-key">Card Key ({counts.cardKey})</TabsTrigger>
            <TabsTrigger value="ficha-tecnica">Ficha Técnica ({counts.fichaTecnica})</TabsTrigger>
            <TabsTrigger value="permiso-circulacion">Permiso Circ. ({counts.permisoCirculacion})</TabsTrigger>
            <TabsTrigger value="resolved">Resueltas ({counts.resolved})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {filteredIncidences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay incidencias para mostrar en esta categoría.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead>Fecha Resolución</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncidences.map((incidence) => (
                      <TableRow key={incidence.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(incidence.tipo_incidencia)}
                            <span className="text-sm">{incidence.tipo_incidencia}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{incidence.matricula}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(incidence.resuelta)}
                            <span className="text-sm">{incidence.resuelta ? "Resuelta" : "Pendiente"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(incidence.created_at)}</TableCell>
                        <TableCell className="text-sm">{formatDate(incidence.fecha_resolucion)}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {incidence.descripcion || "Sin descripción"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
