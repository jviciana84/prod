"use client"

import { CheckCircle, RefreshCw, AlertTriangle, Database, Settings } from "lucide-react"

export default function VerifySyncClient() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Configurar Funciones */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          Configurar Funciones
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea las funciones de sincronización en la base de datos.
        </p>
        <SetupFunctionsForm />
      </div>

      {/* Verificar Funciones */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Verificar Funciones
        </h2>
        <p className="text-sm text-muted-foreground">
          Verifica si las funciones de sincronización están disponibles en la base de datos.
        </p>
        <VerifyFunctionsForm />
      </div>

      {/* Sincronizar Manualmente */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          Sincronizar Manualmente
        </h2>
        <p className="text-sm text-muted-foreground">
          Ejecuta la sincronización manual de fotos con ventas.
        </p>
        <ManualSyncForm />
      </div>

      {/* Verificar Inconsistencias */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Verificar Inconsistencias
        </h2>
        <p className="text-sm text-muted-foreground">
          Verifica inconsistencias entre fotos y ventas.
        </p>
        <CheckInconsistenciesForm />
      </div>

      {/* Estadísticas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-600" />
          Estadísticas
        </h2>
        <p className="text-sm text-muted-foreground">
          Estadísticas actuales del sistema.
        </p>
        <StatisticsForm />
      </div>
    </div>
  )
}

// Componente para configurar funciones
function SetupFunctionsForm() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Configurar funciones</span>
        <button
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          onClick={async () => {
            try {
              const response = await fetch('/api/setup-sync-functions', {
                method: 'POST'
              })
              const result = await response.json()
              if (result.success) {
                alert('✅ Funciones configuradas correctamente')
              } else {
                alert('❌ Error: ' + result.error)
              }
            } catch (error) {
              alert('❌ Error de conexión')
            }
          }}
        >
          Configurar
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        Crea las funciones SQL necesarias para la sincronización
      </div>
    </div>
  )
}

// Componente para verificar funciones
function VerifyFunctionsForm() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Estado de las funciones</span>
        <button
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          onClick={async () => {
            try {
              const response = await fetch('/api/verify-sync-functions', {
                method: 'POST'
              })
              const result = await response.json()
              if (result.success) {
                alert('✅ Funciones verificadas correctamente')
              } else {
                alert('❌ Error: ' + result.error)
              }
            } catch (error) {
              alert('❌ Error de conexión')
            }
          }}
        >
          Verificar
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        • sync_photos_with_sales<br/>
        • check_photos_sales_inconsistencies<br/>
        • handle_vehicle_sold_remove_from_photos<br/>
        • trigger_remove_from_photos_on_sale
      </div>
    </div>
  )
}

// Componente para sincronización manual
function ManualSyncForm() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Sincronización manual</span>
        <button
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200"
          onClick={async () => {
            try {
              const response = await fetch('/api/sync-photos-with-sales', {
                method: 'POST'
              })
              const result = await response.json()
              if (result.success) {
                alert(`✅ Sincronización completada\nProcesados: ${result.processed_count}\nEliminados: ${result.removed_count}`)
              } else {
                alert('❌ Error: ' + result.error)
              }
            } catch (error) {
              alert('❌ Error de conexión')
            }
          }}
        >
          Sincronizar
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        Elimina vehículos vendidos de la tabla de fotos
      </div>
    </div>
  )
}

// Componente para verificar inconsistencias
function CheckInconsistenciesForm() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Inconsistencias</span>
        <button
          className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
          onClick={async () => {
            try {
              const response = await fetch('/api/sync-photos-with-sales', {
                method: 'GET'
              })
              const result = await response.json()
              if (result.success) {
                alert(`📊 Inconsistencias encontradas: ${result.statistics.inconsistencies}`)
              } else {
                alert('❌ Error: ' + result.error)
              }
            } catch (error) {
              alert('❌ Error de conexión')
            }
          }}
        >
          Verificar
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        Vehículos vendidos que aún están en fotos pendientes
      </div>
    </div>
  )
}

// Componente para estadísticas
function StatisticsForm() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Estadísticas</span>
        <button
          className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
          onClick={async () => {
            try {
              const response = await fetch('/api/sync-photos-with-sales', {
                method: 'GET'
              })
              const result = await response.json()
              if (result.success) {
                const stats = result.statistics
                alert(`📊 Estadísticas:\n• Vehículos vendidos: ${stats.sold_vehicles}\n• Vehículos en fotos: ${stats.photos_vehicles}\n• Inconsistencias: ${stats.inconsistencies}`)
              } else {
                alert('❌ Error: ' + result.error)
              }
            } catch (error) {
              alert('❌ Error de conexión')
            }
          }}
        >
          Ver Estadísticas
        </button>
      </div>
      <div className="text-xs text-muted-foreground">
        Estadísticas actuales del sistema de fotos y ventas
      </div>
    </div>
  )
} 