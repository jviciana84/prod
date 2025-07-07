"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { debugAutoResolve } from "@/lib/debug-auto-resolve"
import { autoResolveIncident } from "@/lib/auto-resolve-incidents"
import { createClient } from "@/lib/supabase/client"

interface Vehicle {
  id: string
  license_plate: string
  brand?: string
  model?: string
}

interface User {
  id: string
  full_name: string
}

export default function DebugAutoResolvePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [movementType, setMovementType] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const supabase = createClient()

  // Cargar vehículos y usuarios al inicio
  useEffect(() => {
    const loadData = async () => {
      try {
        // Intentar cargar vehículos de diferentes tablas
        let vehiclesData = null

        // Primero intentar desde 'stock' con sintaxis corregida
        try {
          const { data: stockData, error: stockError } = await supabase
            .from("stock")
            .select("id, license_plate, brand, model")
            .not("license_plate", "is", null)
            .order("license_plate")
            .limit(50)

          if (stockData && stockData.length > 0) {
            vehiclesData = stockData
            console.log("✅ Vehículos cargados desde 'stock':", stockData.length)
          } else if (stockError) {
            console.log("⚠️ Error en stock:", stockError)
          }
        } catch (error) {
          console.log("⚠️ Error consultando stock:", error)
        }

        // Si no hay en stock, intentar desde nuevas_entradas
        if (!vehiclesData) {
          try {
            const { data: nuevasData, error: nuevasError } = await supabase
              .from("nuevas_entradas")
              .select("id, license_plate, brand, model")
              .not("license_plate", "is", null)
              .order("license_plate")
              .limit(50)

            if (nuevasData && nuevasData.length > 0) {
              vehiclesData = nuevasData
              console.log("✅ Vehículos cargados desde 'nuevas_entradas':", nuevasData.length)
            } else if (nuevasError) {
              console.log("⚠️ Error en nuevas_entradas:", nuevasError)
            }
          } catch (error) {
            console.log("⚠️ Error consultando nuevas_entradas:", error)
          }
        }

        // Como último recurso, obtener matrículas únicas de entregas
        if (!vehiclesData) {
          try {
            const { data: entregasData, error: entregasError } = await supabase
              .from("entregas")
              .select("matricula")
              .not("matricula", "is", null)
              .order("matricula")

            if (entregasData && entregasData.length > 0) {
              // Crear objetos de vehículo únicos basados en matrículas
              const matriculasUnicas = [...new Set(entregasData.map((e) => e.matricula))]
              vehiclesData = matriculasUnicas.slice(0, 50).map((matricula) => ({
                id: matricula, // Usar la matrícula como ID
                license_plate: matricula,
                brand: "Desconocido",
                model: "(desde entregas)",
              }))
              console.log("✅ Matrículas cargadas desde 'entregas':", vehiclesData.length)
            } else if (entregasError) {
              console.log("⚠️ Error en entregas:", entregasError)
            }
          } catch (error) {
            console.log("⚠️ Error consultando entregas:", error)
          }
        }

        if (vehiclesData && vehiclesData.length > 0) {
          setVehicles(vehiclesData)
        } else {
          console.error("❌ No se pudieron cargar vehículos de ninguna tabla")
          setVehicles([])
        }

        // Cargar usuarios
        try {
          const { data: usersData, error: usersError } = await supabase
            .from("profiles")
            .select("id, full_name")
            .order("full_name")

          if (usersError) {
            console.error("Error cargando usuarios:", usersError)
          } else {
            setUsers(usersData || [])
            console.log("✅ Usuarios cargados:", usersData?.length || 0)
          }
        } catch (error) {
          console.error("Error consultando usuarios:", error)
        }
      } catch (error) {
        console.error("Error general cargando datos:", error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  const handleDebug = async () => {
    if (!selectedVehicle || !movementType) {
      alert("Por favor selecciona un vehículo y tipo de movimiento")
      return
    }

    setLoading(true)
    try {
      console.log("🔍 Ejecutando diagnóstico...")
      const debugResult = await debugAutoResolve(selectedVehicle, movementType)
      setResult({ type: "debug", data: debugResult })
    } catch (error) {
      console.error("Error en diagnóstico:", error)
      setResult({ type: "error", data: error })
    } finally {
      setLoading(false)
    }
  }

  const handleAutoResolve = async () => {
    if (!selectedVehicle || !movementType || !selectedUser) {
      alert("Por favor completa todos los campos")
      return
    }

    setLoading(true)
    try {
      console.log("🚀 Ejecutando resolución automática...")
      const resolveResult = await autoResolveIncident(
        selectedVehicle as any,
        movementType as any,
        selectedUser,
        "Prueba de resolución automática desde debug",
      )
      setResult({ type: "resolve", data: resolveResult })
    } catch (error) {
      console.error("Error en auto-resolve:", error)
      setResult({ type: "error", data: error })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Cargando datos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de Resolución Automática</CardTitle>
          <CardDescription>
            Herramienta para diagnosticar por qué no se resuelven automáticamente las incidencias
          </CardDescription>
          <div className="text-sm text-muted-foreground">
            <p>
              Vehículos encontrados: {vehicles.length} | Usuarios encontrados: {users.length}
            </p>
            {vehicles.length === 0 && (
              <p className="text-red-600">⚠️ No se encontraron vehículos. Revisa la consola para más detalles.</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle">Vehículo</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.license_plate}>
                      {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="movementType">Tipo de Llave/Documento</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_key">Primera llave</SelectItem>
                  <SelectItem value="second_key">Segunda llave</SelectItem>
                  <SelectItem value="card_key">Card Key</SelectItem>
                  <SelectItem value="technical_sheet">Ficha técnica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="user">Usuario que recibe (solo para auto-resolve)</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleDebug} disabled={loading || !selectedVehicle || !movementType}>
              {loading ? "Ejecutando..." : "🔍 Solo Diagnóstico"}
            </Button>
            <Button
              onClick={handleAutoResolve}
              disabled={loading || !selectedVehicle || !movementType || !selectedUser}
              variant="secondary"
            >
              {loading ? "Ejecutando..." : "🚀 Diagnóstico + Resolver"}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              <Label>Resultado (revisa también la consola del navegador):</Label>
              <Textarea
                value={JSON.stringify(result, null, 2)}
                readOnly
                className="h-96 font-mono text-sm"
                placeholder="Los resultados aparecerán aquí..."
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Instrucciones:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Selecciona un vehículo que sepas que tiene incidencias de llaves</li>
              <li>Selecciona el tipo de llave (ej: "Segunda llave" si la incidencia es "2ª llave")</li>
              <li>Haz clic en "Solo Diagnóstico" para ver qué encuentra el sistema</li>
              <li>Si quieres probar la resolución, selecciona un usuario y haz clic en "Diagnóstico + Resolver"</li>
              <li>Revisa la consola del navegador (F12) para ver logs detallados</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
