"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Settings, Activity } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { useToast } from "@/hooks/use-toast"

interface SystemStatus {
  triggersInstalled: boolean
  totalVehicles: number
  soldInStock: number
  availableInStock: number
  deliveredVehicles: number
  lastCleanup?: string
}

export default function AutomaticCleanupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const { toast } = useToast()

  const checkSystemStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/check-automatic-cleanup-status')
      const data = await response.json()
      
      if (data.success) {
        setSystemStatus(data.status)
      } else {
        toast({
          title: "❌ Error",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "❌ Error",
        description: "Error verificando estado del sistema",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const installAutomaticSystem = async () => {
    setIsInstalling(true)
    try {
      const response = await fetch('/api/install-automatic-cleanup', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "✅ Sistema instalado",
          description: data.message,
        })
        checkSystemStatus() // Actualizar estado
      } else {
        toast({
          title: "❌ Error",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "❌ Error",
        description: "Error instalando sistema automático",
        variant: "destructive"
      })
    } finally {
      setIsInstalling(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()
  }, [])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sistema Automático de Limpieza</h1>
        <p className="text-muted-foreground">
          Gestiona el sistema automático que limpia vehículos vendidos del stock
        </p>
      </div>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>
            Verifica el estado actual del sistema automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Estado del Sistema</span>
            {isLoading ? (
              <BMWMSpinner size={16} />
            ) : systemStatus ? (
              <Badge variant={systemStatus.triggersInstalled ? "default" : "destructive"}>
                {systemStatus.triggersInstalled ? "✅ Activo" : "❌ Inactivo"}
              </Badge>
            ) : (
              <Badge variant="secondary">❓ Desconocido</Badge>
            )}
          </div>

          {systemStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{systemStatus.totalVehicles}</div>
                <div className="text-sm text-muted-foreground">Total Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{systemStatus.soldInStock}</div>
                <div className="text-sm text-muted-foreground">Vendidos en Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemStatus.availableInStock}</div>
                <div className="text-sm text-muted-foreground">Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemStatus.deliveredVehicles}</div>
                <div className="text-sm text-muted-foreground">Entregados</div>
              </div>
            </div>
          )}

          <Button 
            onClick={checkSystemStatus} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Verificando...
              </>
            ) : (
              "🔄 Verificar Estado"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instalación del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Instalación del Sistema
          </CardTitle>
          <CardDescription>
            Instala o reinstala el sistema automático de limpieza
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> La instalación creará triggers automáticos en la base de datos 
              que procesarán vehículos vendidos sin intervención manual.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium">¿Qué hace el sistema automático?</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Detecta automáticamente cuando se marca un vehículo como vendido (is_sold = true)</li>
              <li>Busca la fecha de entrega/venta apropiada en las tablas relacionadas</li>
              <li>Crea automáticamente un registro en la tabla entregas</li>
              <li>Elimina el vehículo del stock automáticamente</li>
              <li>Proceso completamente transparente y automático</li>
            </ul>
          </div>

          <Button 
            onClick={installAutomaticSystem} 
            disabled={isInstalling || (systemStatus?.triggersInstalled)}
            className="w-full"
          >
            {isInstalling ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Instalando...
              </>
            ) : systemStatus?.triggersInstalled ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Sistema Ya Instalado
              </>
            ) : (
              "🚀 Instalar Sistema Automático"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
          <CardDescription>
            Detalles técnicos sobre el funcionamiento del sistema automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <h4 className="font-medium mb-2">Componentes Instalados:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code>handle_vehicle_sold_cleanup()</code> - Función principal de limpieza</li>
                <li><code>trigger_vehicle_sold_cleanup</code> - Trigger para actualizaciones</li>
                <li><code>trigger_vehicle_sold_cleanup_insert</code> - Trigger para inserciones</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Flujo de Procesamiento:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Se detecta cambio en is_sold = true</li>
                <li>Se busca fecha de entrega en tabla entregas</li>
                <li>Si no se encuentra, se busca en sales_vehicles</li>
                <li>Se crea registro en entregas con fecha apropiada</li>
                <li>Se elimina vehículo del stock</li>
                <li>Se registra la acción en logs</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">Ventajas del Sistema Automático:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>✅ Procesamiento inmediato y automático</li>
                <li>✅ Sin intervención manual requerida</li>
                <li>✅ Consistencia en el procesamiento</li>
                <li>✅ Reducción de errores humanos</li>
                <li>✅ Stock siempre actualizado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
