"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesTargetIcon, BMWLogo, MINILogo } from "@/components/ui/brand-logos"
import { Save, Trash2 } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Objetivo {
  id?: string
  concesionario: string
  marca: string
  mes: string
  año: number
  objetivo: number
  created_at?: string
  updated_at?: string
}

export function ObjetivosManager() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newObjetivo, setNewObjetivo] = useState<Objetivo>({
    concesionario: "",
    marca: "",
    mes: "",
    año: new Date().getFullYear(),
    objetivo: 0,
  })

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const concesionarios = ["Motor Munich", "Motor Munich Cadí"]
  const marcas = ["BMW", "MINI"]
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  useEffect(() => {
    loadObjetivos()
  }, [])

  const loadObjetivos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("sales_objectives")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error cargando objetivos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los objetivos",
          variant: "destructive",
        })
      } else {
        setObjetivos(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveObjetivo = async () => {
    try {
      setSaving(true)

      if (
        !newObjetivo.concesionario ||
        !newObjetivo.marca ||
        !newObjetivo.mes ||
        newObjetivo.objetivo === undefined ||
        newObjetivo.objetivo === null
      ) {
        toast({
          title: "Error",
          description: "Todos los campos son obligatorios y el objetivo debe ser un número",
          variant: "destructive",
        })
        return
      }

      // Supabase `onConflict` requiere que las columnas especificadas tengan una restricción UNIQUE o EXCLUSION.
      // Si 'sales_objectives' no tiene una de estas restricciones en (concesionario, marca, mes, año),
      // la cláusula `onConflict` fallará.
      // Para evitar el error "there is no unique or exclusion constraint matching the ON CONFLICT specification",
      // podemos intentar primero hacer un `upsert` si sabemos que la tabla tiene una PK o una restricción única.
      // Si no, la forma más sencilla es intentar insertar y manejar el error de duplicado, o
      // primero buscar si existe y luego actualizar o insertar.

      // Opción 1: Intentar upsert si hay una restricción única en (concesionario, marca, mes, año)
      // Si no existe tal restricción, esta línea causará el error 42P10.
      const { data, error } = await supabase
        .from("sales_objectives")
        .upsert(
          {
            concesionario: newObjetivo.concesionario,
            marca: newObjetivo.marca,
            mes: newObjetivo.mes,
            año: newObjetivo.año,
            objetivo: newObjetivo.objetivo,
          },
          { onConflict: "concesionario, marca, mes, año" }, // Asegúrate de que estas columnas tienen una restricción UNIQUE
        )
        .select()

      if (error) {
        console.error("Error guardando objetivo:", error)
        toast({
          title: "Error",
          description: `No se pudo guardar el objetivo: ${error.message}. Asegúrate de que no hay un objetivo duplicado para el mismo concesionario, marca, mes y año.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Éxito",
          description: "Objetivo guardado correctamente",
        })
        setNewObjetivo({
          concesionario: "",
          marca: "",
          mes: "",
          año: new Date().getFullYear(),
          objetivo: 0,
        })
        loadObjetivos()
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error de conexión o al procesar la solicitud",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteObjetivo = async (id: string) => {
    try {
      const { error } = await supabase.from("sales_objectives").delete().eq("id", id)

      if (error) {
        console.error("Error eliminando objetivo:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el objetivo",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Éxito",
          description: "Objetivo eliminado correctamente",
        })
        loadObjetivos()
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="crear" className="space-y-4">
        <TabsList>
          <TabsTrigger value="crear">Crear Objetivo</TabsTrigger>
          <TabsTrigger value="gestionar">Gestionar Objetivos</TabsTrigger>
        </TabsList>

        <TabsContent value="crear" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SalesTargetIcon className="h-5 w-5 text-blue-500" />
                Nuevo Objetivo
              </CardTitle>
              <CardDescription>Configura un nuevo objetivo de ventas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="concesionario">Concesionario</Label>
                  <Select
                    value={newObjetivo.concesionario}
                    onValueChange={(value) => setNewObjetivo({ ...newObjetivo, concesionario: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecciona concesionario" />
                    </SelectTrigger>
                    <SelectContent>
                      {concesionarios.map((concesionario) => (
                        <SelectItem key={concesionario} value={concesionario}>
                          {concesionario}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Select
                    value={newObjetivo.marca}
                    onValueChange={(value) => setNewObjetivo({ ...newObjetivo, marca: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecciona marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcas.map((marca) => (
                        <SelectItem key={marca} value={marca}>
                          <div className="flex items-center gap-2">
                            {marca === "BMW" ? <BMWLogo className="h-4 w-4" /> : <MINILogo className="h-4 w-4" />}
                            {marca}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes">Mes</Label>
                  <Select
                    value={newObjetivo.mes}
                    onValueChange={(value) => setNewObjetivo({ ...newObjetivo, mes: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecciona mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map((mes) => (
                        <SelectItem key={mes} value={mes}>
                          {mes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="año">Año</Label>
                  <Input
                    type="number"
                    value={newObjetivo.año}
                    onChange={(e) => setNewObjetivo({ ...newObjetivo, año: Number.parseInt(e.target.value) })}
                    min="2024"
                    max="2030"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="objetivo">Objetivo (número de ventas)</Label>
                  <Input
                    type="number"
                    value={newObjetivo.objetivo}
                    onChange={(e) => setNewObjetivo({ ...newObjetivo, objetivo: Number.parseInt(e.target.value) })}
                    min="0"
                    placeholder="Ej: 50"
                    className="bg-background"
                  />
                </div>
              </div>

              <Button onClick={saveObjetivo} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Objetivo"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gestionar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objetivos Configurados</CardTitle>
              <CardDescription>Lista de todos los objetivos configurados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                      <div className="h-6 w-6 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : objetivos.length === 0 ? (
                <div className="text-center py-8">
                  <SalesTargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay objetivos configurados</p>
                  <p className="text-sm text-muted-foreground">
                    Crea tu primer objetivo en la pestaña "Crear Objetivo"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {objetivos.map((objetivo) => (
                    <div key={objetivo.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {objetivo.marca === "BMW" ? <BMWLogo className="h-6 w-6" /> : <MINILogo className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {objetivo.concesionario} - {objetivo.marca}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {objetivo.mes} {objetivo.año} - Objetivo: {objetivo.objetivo} ventas
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => objetivo.id && deleteObjetivo(objetivo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
