"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Upload, Download, Check, X, Sparkles, Palette, Armchair } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface VehiculoComparador {
  id: string
  vin: string
  pdf_url: string
  pdf_filename: string
  marca?: string
  modelo?: string
  version?: string
  color?: string
  tapiceria?: string
  equipacion: string[]
  kilometros?: number
  fecha_matriculacion?: string
  precio?: number
}

interface ComparadorTableProps {
  onRefresh?: () => void
}

export default function ComparadorTable({ onRefresh }: ComparadorTableProps) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [vehiculos, setVehiculos] = useState<VehiculoComparador[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<any>({})
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [topN, setTopN] = useState(3)

  useEffect(() => {
    cargarVehiculos()
  }, [])

  const cargarVehiculos = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from("comparador_vehiculos")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error cargando vehículos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los vehículos",
        variant: "destructive"
      })
      return
    }

    setVehiculos(data || [])
    setLoading(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const totalFiles = files.length
    setUploadProgress({ current: 0, total: totalFiles })

    // Procesar archivos UNO POR UNO con progreso real
    const results = []
    let currentFile = 0

    for (const file of Array.from(files)) {
      currentFile++
      setUploadProgress({ current: currentFile, total: totalFiles })

      const formData = new FormData()
      formData.append("files", file)

      try {
        const response = await fetch("/api/comparador/upload", {
          method: "POST",
          body: formData
        })

        const result = await response.json()

        if (!response.ok) {
          results.push({
            filename: file.name,
            success: false,
            error: result.error || result.message || "Error desconocido"
          })
        } else {
          results.push(...result.results)
        }
      } catch (error: any) {
        results.push({
          filename: file.name,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter((r: any) => r.success).length
    const errorCount = results.filter((r: any) => !r.success).length

    if (errorCount > 0) {
      const errors = results.filter((r: any) => !r.success)
      console.error("Errores de carga:")
      errors.forEach((err: any) => {
        console.error(`- ${err.filename}: ${err.error}`)
      })
      
      toast({
        title: "Carga con errores",
        description: `${successCount} OK, ${errorCount} errores. Ver consola.`,
        variant: errorCount === totalFiles ? "destructive" : "default"
      })
    } else {
      toast({
        title: "Carga completada",
        description: `${successCount} archivo(s) procesados correctamente.`,
      })
    }

    await cargarVehiculos()
    onRefresh?.()
    
    setUploading(false)
    setUploadProgress({ current: 0, total: 0 })
    event.target.value = ""
  }

  const handleEdit = (vehiculo: VehiculoComparador) => {
    setEditingId(vehiculo.id)
    setEditingData({
      kilometros: vehiculo.kilometros || "",
      fecha_matriculacion: vehiculo.fecha_matriculacion || "",
      precio: vehiculo.precio || "",
      marca: vehiculo.marca || "",
      modelo: vehiculo.modelo || "",
      version: vehiculo.version || "",
      color: vehiculo.color || "",
      tapiceria: vehiculo.tapiceria || "",
      equipacion: vehiculo.equipacion.join(", ")
    })
  }

  const handleSave = async (id: string) => {
    try {
      const equipacionArray = editingData.equipacion 
        ? editingData.equipacion.split(",").map((item: string) => item.trim()).filter(Boolean)
        : []

      const response = await fetch("/api/comparador/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          kilometros: editingData.kilometros ? parseInt(editingData.kilometros) : null,
          fecha_matriculacion: editingData.fecha_matriculacion || null,
          precio: editingData.precio ? parseFloat(editingData.precio) : null,
          marca: editingData.marca || null,
          modelo: editingData.modelo || null,
          version: editingData.version || null,
          color: editingData.color || null,
          tapiceria: editingData.tapiceria || null,
          equipacion: equipacionArray
        })
      })

      if (!response.ok) throw new Error("Error al actualizar")

      toast({
        title: "Éxito",
        description: "Vehículo actualizado correctamente"
      })

      setEditingId(null)
      await cargarVehiculos()
      onRefresh?.()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el vehículo",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este vehículo?")) return

    try {
      const response = await fetch("/api/comparador/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })

      if (!response.ok) throw new Error("Error al eliminar")

      toast({
        title: "Éxito",
        description: "Vehículo eliminado correctamente"
      })

      await cargarVehiculos()
      onRefresh?.()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el vehículo",
        variant: "destructive"
      })
    }
  }

  const handleClearAll = async () => {
    if (!confirm("¿Seguro que deseas limpiar todo el comparador?")) return

    try {
      const response = await fetch("/api/comparador/clear", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Error al limpiar")

      toast({
        title: "Éxito",
        description: "Comparador limpiado correctamente"
      })

      await cargarVehiculos()
      onRefresh?.()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo limpiar el comparador",
        variant: "destructive"
      })
    }
  }

  // Obtener todas las opciones de equipación únicas
  const todasEquipaciones = Array.from(
    new Set(vehiculos.flatMap(v => v.equipacion))
  ).sort()

  // Generar recomendación con detalles
  const getRecomendacionDetallada = () => {
    if (vehiculos.length === 0) return null

    const resultados = vehiculos.map(vehiculo => {
      let puntuacion = 0
      const desglose: any = {}

      // Más equipación = más puntos
      const equipacionPuntos = vehiculo.equipacion.length * 2
      puntuacion += equipacionPuntos
      desglose.equipacion = { puntos: equipacionPuntos, valor: vehiculo.equipacion.length }

      // Menos KM = más puntos
      if (vehiculo.kilometros) {
        const kmPuntos = Math.max(0, 10 - (vehiculo.kilometros / 10000))
        puntuacion += kmPuntos
        desglose.kilometros = { puntos: Math.round(kmPuntos * 10) / 10, valor: vehiculo.kilometros }
      }

      // Menor precio = más puntos
      if (vehiculo.precio) {
        const precioPuntos = Math.max(0, 10 - (vehiculo.precio / 5000))
        puntuacion += precioPuntos
        desglose.precio = { puntos: Math.round(precioPuntos * 10) / 10, valor: vehiculo.precio }
      }

      // Más reciente = más puntos
      if (vehiculo.fecha_matriculacion) {
        const año = new Date(vehiculo.fecha_matriculacion).getFullYear()
        const añoActual = new Date().getFullYear()
        const añosPuntos = Math.max(0, 10 - (añoActual - año))
        puntuacion += añosPuntos
        desglose.antiguedad = { puntos: Math.round(añosPuntos * 10) / 10, años: añoActual - año }
      }

      return {
        vehiculo,
        puntuacion: Math.round(puntuacion * 10) / 10,
        desglose
      }
    })

    resultados.sort((a, b) => b.puntuacion - a.puntuacion)
    return resultados
  }

  const recomendaciones = getRecomendacionDetallada()
  const topRecomendaciones = recomendaciones ? recomendaciones.slice(0, topN) : []
  const vehiculoRecomendado = recomendaciones && recomendaciones.length > 0 ? recomendaciones[0].vehiculo : null
  
  const toggleRowSelection = (equipacion: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(equipacion)) {
      newSelection.delete(equipacion)
    } else {
      newSelection.add(equipacion)
    }
    setSelectedRows(newSelection)
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      {/* Acciones principales */}
      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => document.getElementById("file-upload")?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Subiendo..." : "Subir PDFs"}
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="destructive" onClick={handleClearAll} disabled={vehiculos.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Todo
          </Button>
        </div>

        {/* Progress indicator */}
        {uploading && uploadProgress.total > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Procesando PDFs...</span>
                  <span className="font-medium">{uploadProgress.current} / {uploadProgress.total}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Extrayendo: VIN, marca, modelo, color, tapicería, equipación...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {vehiculos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay vehículos cargados. Sube PDFs para comenzar la comparación.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Recomendaciones TOP N */}
          {topRecomendaciones.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Top {topN} Recomendaciones
                  </CardTitle>
                  <select 
                    value={topN} 
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="text-xs border rounded px-2 py-1 bg-background"
                  >
                    <option value={1}>Top 1</option>
                    <option value={3}>Top 3</option>
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {topRecomendaciones.map((rec, index) => (
                  <div key={rec.vehiculo.id} className={`p-2 rounded ${index === 0 ? 'bg-primary/10 border border-primary/30' : 'bg-background/50'}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={index === 0 ? "default" : "outline"} className="text-xs px-2 py-0.5">
                        #{index + 1}
                      </Badge>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono">
                        {rec.vehiculo.vin}
                      </Badge>
                      <span className="text-xs font-medium flex-1">
                        {rec.vehiculo.marca} {rec.vehiculo.modelo}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {rec.puntuacion} pts
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-1 mt-1.5 text-[10px]">
                      {rec.desglose.equipacion && (
                        <div className="text-muted-foreground">
                          ⚙️ {rec.desglose.equipacion.puntos}p
                        </div>
                      )}
                      {rec.desglose.kilometros && (
                        <div className="text-muted-foreground">
                          🛣️ {rec.desglose.kilometros.puntos}p
                        </div>
                      )}
                      {rec.desglose.precio && (
                        <div className="text-muted-foreground">
                          💰 {rec.desglose.precio.puntos}p
                        </div>
                      )}
                      {rec.desglose.antiguedad && (
                        <div className="text-muted-foreground">
                          📅 {rec.desglose.antiguedad.puntos}p
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tabla de gestión de datos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Datos de Vehículos</CardTitle>
              <CardDescription className="text-xs">
                {vehiculos.length > 0 && vehiculos.filter(v => !v.kilometros && !v.precio).length > 0 && (
                  <span className="text-amber-600">⚠ Agrega KM y Precio para mejor recomendación</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="py-1">VIN</TableHead>
                      <TableHead className="py-1">Marca</TableHead>
                      <TableHead className="py-1">Modelo</TableHead>
                      <TableHead className="py-1">Color</TableHead>
                      <TableHead className="py-1">Tapicería</TableHead>
                      <TableHead className="py-1">KM</TableHead>
                      <TableHead className="py-1">Fecha</TableHead>
                      <TableHead className="py-1">Precio</TableHead>
                      <TableHead className="py-1">PDF</TableHead>
                      <TableHead className="py-1">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehiculos.map((vehiculo) => (
                      <TableRow key={vehiculo.id} className="text-xs">
                        <TableCell className="font-mono py-1">{vehiculo.vin}</TableCell>
                        <TableCell className="py-1">
                          {editingId === vehiculo.id ? (
                            <Input
                              value={editingData.marca}
                              onChange={(e) => setEditingData({ ...editingData, marca: e.target.value })}
                              className="w-20 h-7 text-xs"
                            />
                          ) : (
                            vehiculo.marca || "-"
                          )}
                        </TableCell>
                        <TableCell className="py-1">
                          {editingId === vehiculo.id ? (
                            <Input
                              value={editingData.modelo}
                              onChange={(e) => setEditingData({ ...editingData, modelo: e.target.value })}
                              className="w-28 h-7 text-xs"
                            />
                          ) : (
                            <div className="truncate max-w-[120px]" title={vehiculo.modelo || ''}>
                              {vehiculo.modelo || "-"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-1">
                          {editingId === vehiculo.id ? (
                            <Input
                              value={editingData.color}
                              onChange={(e) => setEditingData({ ...editingData, color: e.target.value })}
                              className="w-24 h-7 text-xs"
                            />
                          ) : (
                            vehiculo.color || "-"
                          )}
                        </TableCell>
                        <TableCell className="py-1">
                          {editingId === vehiculo.id ? (
                            <Input
                              value={editingData.tapiceria}
                              onChange={(e) => setEditingData({ ...editingData, tapiceria: e.target.value })}
                              className="w-28 h-7 text-xs"
                            />
                          ) : (
                            <div className="truncate max-w-[100px]" title={vehiculo.tapiceria || ''}>
                              {vehiculo.tapiceria || "-"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-1">
                          {editingId === vehiculo.id ? (
                            <Input
                              type="number"
                              value={editingData.kilometros}
                              onChange={(e) => setEditingData({ ...editingData, kilometros: e.target.value })}
                              className="w-20 h-7 text-xs"
                            />
                          ) : (
                            vehiculo.kilometros?.toLocaleString() || "-"
                          )}
                        </TableCell>
                        <TableCell className="py-1">
                          {editingId === vehiculo.id ? (
                            <Input
                              type="date"
                              value={editingData.fecha_matriculacion}
                              onChange={(e) => setEditingData({ ...editingData, fecha_matriculacion: e.target.value })}
                              className="w-32 h-7 text-xs"
                            />
                          ) : (
                            vehiculo.fecha_matriculacion || "-"
                          )}
                        </TableCell>
                        <TableCell className="py-1">
                          {editingId === vehiculo.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingData.precio}
                              onChange={(e) => setEditingData({ ...editingData, precio: e.target.value })}
                              className="w-24 h-7 text-xs"
                            />
                          ) : (
                            vehiculo.precio ? `${vehiculo.precio.toLocaleString()}€` : "-"
                          )}
                        </TableCell>
                        <TableCell className="py-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => window.open(vehiculo.pdf_url, "_blank")}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell className="py-1">
                          <div className="flex gap-1">
                            {editingId === vehiculo.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleSave(vehiculo.id)}
                                >
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditingId(null)}
                                >
                                  <X className="h-3 w-3 text-red-600" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleEdit(vehiculo)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleDelete(vehiculo.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Tabla comparativa de equipación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Comparativa de Equipación</CardTitle>
              <CardDescription className="text-xs">✓ = Incluido · ✗ = No incluido · Clic en fila para resaltar</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-auto max-h-[500px] rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                      <th 
                        className="py-1.5 px-4 text-left font-semibold border-b-2"
                        style={{ 
                          position: 'sticky', 
                          left: 0, 
                          top: 0,
                          zIndex: 30,
                          minWidth: '220px',
                          backgroundColor: 'hsl(var(--background))',
                          boxShadow: '3px 0 10px rgba(0,0,0,0.15)'
                        }}
                      >
                        Característica
                      </th>
                      {vehiculos.map((vehiculo) => (
                        <th 
                          key={vehiculo.id} 
                          className="text-center py-1.5 px-3 border-b-2"
                          style={{ 
                            minWidth: '140px', 
                            position: 'sticky', 
                            top: 0,
                            backgroundColor: 'hsl(var(--background))'
                          }}
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-sm flex items-center justify-center gap-1.5">
                              {vehiculo.vin}
                              {vehiculoRecomendado?.id === vehiculo.id && (
                                <Sparkles className="h-4 w-4 text-primary fill-primary/20" />
                              )}
                            </div>
                            {vehiculo.color && (
                              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                                <Palette className="h-3 w-3" />
                                <span className="font-medium">{vehiculo.color}</span>
                              </div>
                            )}
                            {vehiculo.tapiceria && (
                              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1" title={vehiculo.tapiceria}>
                                <Armchair className="h-3 w-3" />
                                <span className="truncate max-w-[100px]">{vehiculo.tapiceria}</span>
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todasEquipaciones.map((equipacion) => (
                      <tr 
                        key={equipacion} 
                        className="cursor-pointer transition-colors border-b hover:bg-muted/30"
                        onClick={() => toggleRowSelection(equipacion)}
                        style={{
                          backgroundColor: selectedRows.has(equipacion) ? 'hsl(var(--primary) / 0.1)' : 'transparent'
                        }}
                      >
                        <td 
                          className="py-1 px-4 text-xs font-medium whitespace-nowrap"
                          style={{ 
                            position: 'sticky', 
                            left: 0, 
                            zIndex: 10,
                            backgroundColor: selectedRows.has(equipacion) ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--background))',
                            boxShadow: '3px 0 10px rgba(0,0,0,0.1)'
                          }}
                        >
                          {equipacion}
                        </td>
                        {vehiculos.map((vehiculo) => (
                          <td key={vehiculo.id} className="text-center py-1">
                            {vehiculo.equipacion.includes(equipacion) ? (
                              <Check className="h-5 w-5 mx-auto stroke-[3]" style={{ color: '#15803d' }} />
                            ) : (
                              <X className="h-5 w-5 mx-auto opacity-35 stroke-[3]" style={{ color: '#dc2626' }} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

