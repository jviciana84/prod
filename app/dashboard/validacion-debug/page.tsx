"use client"

import { useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle, Database, RefreshCw } from "lucide-react"
import { syncValidatedVehicle } from "@/server-actions/validation-actions"
import { toast } from "sonner"

export default function ValidacionDebugPage() {
  const [loading, setLoading] = useState(false)
  const [salesVehicles, setSalesVehicles] = useState([])
  const [validatedVehicles, setValidatedVehicles] = useState([])
  const [tableExists, setTableExists] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [logs, setLogs] = useState([])

  const supabase = createClientComponentClient()

  const addLog = (message: string, type: "info" | "error" | "success" = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, { timestamp, message, type }])
  }

  // Crear la tabla pedidos_validados
  const createTable = async () => {
    try {
      addLog("Intentando crear la tabla pedidos_validados...")

      // Primero intentamos crear la tabla usando SQL directo
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.pedidos_validados (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          vehicle_id UUID,
          license_plate VARCHAR(20) NOT NULL,
          model VARCHAR(100) NOT NULL,
          vehicle_type VARCHAR(50) DEFAULT 'Coche',
          document_type VARCHAR(10) DEFAULT 'DNI',
          document_number VARCHAR(20),
          client_name VARCHAR(100),
          price DECIMAL(10, 2) DEFAULT 0,
          payment_method VARCHAR(50) DEFAULT 'Contado',
          status VARCHAR(50) NOT NULL DEFAULT 'Validado',
          validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          advisor_id UUID,
          advisor_name VARCHAR(100),
          observations TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      const { data, error } = await supabase.rpc("exec_sql", { sql: createTableSQL })

      if (error) {
        addLog(`❌ Error al crear tabla con RPC: ${error.message}`, "error")

        // Intentar método alternativo: insertar un registro dummy para forzar la creación
        addLog("Intentando método alternativo...")
        const { error: insertError } = await supabase.from("pedidos_validados").insert({
          vehicle_id: "00000000-0000-0000-0000-000000000000",
          license_plate: "TEST",
          model: "TEST",
          status: "TEST",
        })

        if (insertError) {
          addLog(`❌ Método alternativo falló: ${insertError.message}`, "error")
          addLog("⚠️ Necesitas crear la tabla manualmente en Supabase", "error")
        } else {
          addLog("✅ Tabla creada con método alternativo", "success")
          // Eliminar el registro de prueba
          await supabase.from("pedidos_validados").delete().eq("license_plate", "TEST")
        }
      } else {
        addLog("✅ Tabla creada exitosamente", "success")
      }

      // Verificar si ahora existe
      await checkTableExists()
    } catch (err) {
      addLog(`❌ Error inesperado: ${err.message}`, "error")
    }
  }

  // Verificar si la tabla pedidos_validados existe
  const checkTableExists = async () => {
    try {
      addLog("Verificando si existe la tabla pedidos_validados...")
      const { data, error } = await supabase.from("pedidos_validados").select("count(*)").limit(1)

      if (error) {
        addLog(`Error al verificar tabla: ${error.message}`, "error")
        setTableExists(false)
      } else {
        addLog("✅ La tabla pedidos_validados existe", "success")
        setTableExists(true)
      }
    } catch (err) {
      addLog(`Error inesperado: ${err.message}`, "error")
      setTableExists(false)
    }
  }

  // Cargar vehículos de sales_vehicles
  const loadSalesVehicles = async () => {
    try {
      addLog("Cargando vehículos de sales_vehicles...")
      const { data, error } = await supabase
        .from("sales_vehicles")
        .select("id, license_plate, model, validated, validation_date, advisor")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        addLog(`Error al cargar sales_vehicles: ${error.message}`, "error")
      } else {
        setSalesVehicles(data || [])
        addLog(`✅ Cargados ${data?.length || 0} vehículos de sales_vehicles`, "success")
      }
    } catch (err) {
      addLog(`Error inesperado: ${err.message}`, "error")
    }
  }

  // Cargar vehículos validados
  const loadValidatedVehicles = async () => {
    try {
      addLog("Cargando vehículos de pedidos_validados...")
      const { data, error } = await supabase
        .from("pedidos_validados")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        addLog(`Error al cargar pedidos_validados: ${error.message}`, "error")
        setValidatedVehicles([])
      } else {
        setValidatedVehicles(data || [])
        addLog(`✅ Cargados ${data?.length || 0} vehículos de pedidos_validados`, "success")
      }
    } catch (err) {
      addLog(`Error inesperado: ${err.message}`, "error")
      setValidatedVehicles([])
    }
  }

  // Probar sincronización con un vehículo específico
  const testSync = async (vehicleId: string, isValidated: boolean) => {
    try {
      setTestResult(null)
      addLog(`Probando sincronización para vehículo ${vehicleId} (validado: ${isValidated})...`)

      const result = await syncValidatedVehicle(vehicleId, isValidated)

      if (result.success) {
        addLog("✅ Sincronización exitosa", "success")
        setTestResult({ success: true, message: "Sincronización completada" })
        toast.success("Sincronización exitosa")
        // Recargar datos
        await loadValidatedVehicles()
      } else {
        addLog(`❌ Error en sincronización: ${result.error}`, "error")
        setTestResult({ success: false, message: result.error })
        toast.error(`Error: ${result.error}`)
      }
    } catch (err) {
      addLog(`❌ Error inesperado: ${err.message}`, "error")
      setTestResult({ success: false, message: err.message })
      toast.error(`Error: ${err.message}`)
    }
  }

  // Cargar todos los datos
  const loadAllData = async () => {
    setLoading(true)
    setLogs([])
    addLog("Iniciando diagnóstico completo...")

    await checkTableExists()
    await loadSalesVehicles()
    await loadValidatedVehicles()

    addLog("Diagnóstico completado")
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug de Validación</h1>
          <p className="text-muted-foreground">
            Diagnóstico del sistema de sincronización entre sales_vehicles y pedidos_validados
          </p>
        </div>
        <Button onClick={loadAllData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Actualizar
        </Button>
      </div>

      {/* Estado de la tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado de la Tabla pedidos_validados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tableExists === null ? (
            <Badge variant="secondary">No verificado</Badge>
          ) : tableExists ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Existe
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              No existe
            </Badge>
          )}
          {!tableExists && (
            <div className="mt-3">
              <Button onClick={createTable} disabled={loading} variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Crear Tabla
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehículos en sales_vehicles */}
      <Card>
        <CardHeader>
          <CardTitle>Vehículos en sales_vehicles (últimos 10)</CardTitle>
          <CardDescription>
            Total: {salesVehicles.length} | Validados: {salesVehicles.filter((v) => v.validated).length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {salesVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Badge variant={vehicle.validated ? "default" : "secondary"}>
                    {vehicle.validated ? "Validado" : "No validado"}
                  </Badge>
                  <span className="font-medium">{vehicle.license_plate}</span>
                  <span className="text-sm text-muted-foreground">{vehicle.model}</span>
                  <span className="text-sm text-muted-foreground">{vehicle.advisor}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => testSync(vehicle.id, true)} disabled={loading}>
                    Validar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => testSync(vehicle.id, false)} disabled={loading}>
                    Desvalidar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vehículos validados */}
      <Card>
        <CardHeader>
          <CardTitle>Vehículos en pedidos_validados</CardTitle>
          <CardDescription>Total: {validatedVehicles.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {validatedVehicles.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No hay vehículos en la tabla pedidos_validados</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {validatedVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">Validado</Badge>
                    <span className="font-medium">{vehicle.license_plate}</span>
                    <span className="text-sm text-muted-foreground">{vehicle.model}</span>
                    <span className="text-sm text-muted-foreground">{vehicle.advisor_name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vehicle.validation_date ? new Date(vehicle.validation_date).toLocaleString() : "Sin fecha"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado del test */}
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{testResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground font-mono">{log.timestamp}</span>
                <span
                  className={
                    log.type === "error"
                      ? "text-red-600"
                      : log.type === "success"
                        ? "text-green-600"
                        : "text-foreground"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
