"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Table, Terminal, Calendar, Clock, Hash, Truck } from "lucide-react"
import TransportTable from "./transport-table"
import TransportQuickForm from "./transport-quick-form"
import ScraperConsole from "./scraper-console"
import { AutoRefreshIndicator } from "@/components/ui/auto-refresh-indicator"
import { AutoRefreshSettings } from "@/components/ui/auto-refresh-settings"
import { CheckRemovedVehiclesButton } from "@/components/ui/check-removed-vehicles-button"


interface TransportDashboardProps {
  initialTransports: any[]
  locations: any[]
  userRoles?: string[]
  onRefresh?: () => void
  isLoading?: boolean
  autoRefreshProps?: {
    isActive: boolean
    interval: number
    onToggle: () => void
    lastRefresh: Date
    onIntervalChange: (interval: number) => void
  }
}

export default function TransportDashboard({ 
  initialTransports, 
  locations, 
  userRoles = [],
  onRefresh,
  isLoading = false,
  autoRefreshProps
}: TransportDashboardProps) {
  const [transports, setTransports] = useState<any[]>(initialTransports || [])
  const [isAddingTransport, setIsAddingTransport] = useState(false)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [lastScrapingDate, setLastScrapingDate] = useState<string>("")
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)


  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Determinar si el usuario es administrador basado en sus roles
  useEffect(() => {
    const hasAdminRole = userRoles.some(
      (role) => role === "admin" || role === "administrador" || role.includes("admin"),
    )
    setIsAdmin(hasAdminRole)
  }, [userRoles])

  // Obtener la fecha del último scraping
  const fetchLastScrapingDate = async () => {
    try {
      const { data, error } = await supabase
        .from("scraper_logs")
        .select("timestamp")
        .eq("level", "success")
        .ilike("message", "%Datos enviados correctamente%")
        .order("timestamp", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error al obtener último scraping:", error)
        return
      }

      if (data && data.length > 0) {
        setLastScrapingDate(data[0].timestamp)
      }
    } catch (err) {
      console.error("Error al obtener último scraping:", err)
    }
  }

  // Cargar datos completos de transporte
  const fetchTransports = async () => {
    try {
      // Primero obtenemos los transportes sin relaciones
      const { data: transportData, error } = await supabase
        .from("nuevas_entradas")
        .select("*")
        .order("purchase_date", { ascending: false })

      if (error) {
        console.error("Error al cargar datos de nuevas entradas:", error)
        return
      }

      // Luego obtenemos las ubicaciones
      const { data: locationData } = await supabase.from("locations").select("*")

      // Creamos un mapa de ubicaciones para búsqueda rápida
      const locationMap = locationData
        ? locationData.reduce((map, loc) => {
            map[loc.id] = loc
            return map
          }, {})
        : {}

      // Obtenemos los tipos de gastos
      const { data: expenseTypeData } = await supabase.from("expense_types").select("*")

      // Creamos un mapa de tipos de gastos para búsqueda rápida
      const expenseTypeMap = expenseTypeData
        ? expenseTypeData.reduce((map, type) => {
            map[type.id] = type
            return map
          }, {})
        : {}

      // Combinamos los datos manualmente
      const enrichedData = transportData.map((transport) => ({
        ...transport,
        origin_location: locationMap[transport.origin_location_id] || null,
        expense_type: expenseTypeMap[transport.expense_type_id] || null,
      }))

      setTransports(enrichedData || [])
    } catch (err) {
      console.error("Error al cargar datos de nuevas entradas:", err)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchTransports()
    fetchLastScrapingDate()
  }, [])

  // Suscripción en tiempo real para actualizar automáticamente la tabla
  useEffect(() => {
    console.log("🔔 Configurando suscripción en tiempo real para nuevas_entradas...")
    
    const channel = supabase
      .channel('nuevas_entradas_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'nuevas_entradas'
        },
        async (payload) => {
          console.log('📡 Cambio detectado en nuevas_entradas:', payload.eventType)
          
          // Recargar los datos cuando hay cambios
          await fetchTransports()
          
          // Mostrar notificación según el tipo de evento
          switch(payload.eventType) {
            case 'INSERT':
              toast({
                title: "Transporte actualizado",
                description: "Nuevo transporte añadido"
              })
              break
            case 'UPDATE':
              toast({
                title: "Transporte actualizado",
                description: "Información del transporte actualizada"
              })
              break
            case 'DELETE':
              toast({
                title: "Transporte actualizado",
                description: "Transporte eliminado"
              })
              break
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscripción a nuevas_entradas activa')
        }
      })

    // Cleanup: remover el canal cuando el componente se desmonte
    return () => {
      console.log('🔌 Desconectando suscripción de nuevas_entradas...')
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Manejar el evento de transporte añadido
  const handleTransportAdded = (newTransport: any) => {
    setTransports((prev) => [newTransport, ...prev])
    // Resetear el estado del formulario
    setIsAddingTransport(false)
    setIsFormSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Card de Registro Rápido */}
      {/* Cards de Estadísticas o Formulario */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {!isAddingTransport ? (
          <>
            {/* Total Entradas */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Entradas</p>
                  <p className="text-2xl font-bold">{transports.length}</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            {/* Este Mes */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mes</p>
                  <p className="text-2xl font-bold text-green-500">
                    {transports.filter(t => {
                      const purchaseDate = new Date(t.purchase_date)
                      const now = new Date()
                      return purchaseDate.getMonth() === now.getMonth() && 
                             purchaseDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            {/* Última Semana */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Última Semana</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {transports.filter(t => {
                      const purchaseDate = new Date(t.purchase_date)
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return purchaseDate >= weekAgo
                    }).length}
                  </p>
                </div>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </Card>

            {/* Promedio Precio */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Promedio Precio</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {(() => {
                      const prices = transports
                        .filter(t => t.purchase_price)
                        .map(t => t.purchase_price)
                      if (prices.length === 0) return 0
                      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
                      return Math.round(avg).toLocaleString()
                    })()}€
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Hash className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </Card>

            {/* Media Días Llegada */}
            <Card className="p-4 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Media Días Llegada</p>
                  <p className="text-2xl font-bold text-indigo-500">
                    {(() => {
                      const vehiclesWithDates = transports.filter(t => t.purchase_date && t.created_at)
                      if (vehiclesWithDates.length === 0) return 0
                      
                      const daysArray = vehiclesWithDates.map(t => {
                        const purchaseDate = new Date(t.purchase_date)
                        const createdDate = new Date(t.created_at)
                        const diffTime = Math.abs(purchaseDate.getTime() - createdDate.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                        return diffDays
                      })
                      
                      const avgDays = daysArray.reduce((a, b) => a + b, 0) / daysArray.length
                      return Math.round(avgDays)
                    })()} días
                  </p>
                </div>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                  <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </Card>

            {/* Card de Añadir Entrada */}
            <Card className="p-4 relative border-2 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] dark:shadow-[0_0_10px_rgba(96,165,250,0.3)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Añadir Entrada</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingTransport(!isAddingTransport)}
                    className="mt-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                  </Button>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
          </>
        ) : (
          /* Card del Formulario (ocupa todo el ancho) */
          <Card className="lg:col-span-6">
            <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-blue-600" />
                    Añadir Entrada Manual
              </CardTitle>
                  <CardDescription>Registra una nueva entrada de vehículo</CardDescription>
            </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingTransport(false)}
                >
                  <Plus className="h-4 w-4 mr-2 rotate-45" />
                  Ocultar
                </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <TransportQuickForm
            locations={locations}
            onTransportAdded={handleTransportAdded}
                 isSubmitting={isFormSubmitting}
                 setIsSubmitting={setIsFormSubmitting}
          />
        </CardContent>
      </Card>
        )}
      </div>

      {/* Card de Lista de Vehículos */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Table className="h-5 w-5 text-blue-600" />
                Vehículos Registrados
              </CardTitle>
              <CardDescription>Seguimiento y gestión de vehículos registrados</CardDescription>
            </div>
            
            {/* Información del último scraping DUC y controles de auto-refresh */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-6 px-1 bg-green-500/20 border border-green-500/30 font-mono text-xs animate-pulse"
                  title="Estado del scraper"
                  onClick={() => setIsConsoleOpen(true)}
                >
                  <span className="text-green-500">>_</span>
                </Button>
                <span>Último scraping DUC:</span>
                <span className="font-mono text-xs">
                  {lastScrapingDate ? (
                    new Date(lastScrapingDate).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'UTC'
                    })
                  ) : (
                    'Nunca'
                  )}
                </span>
              </div>
              
              {/* Controles de auto-refresh */}
              {autoRefreshProps && (
                <div className="flex items-center gap-2">
                  <AutoRefreshIndicator
                    isActive={autoRefreshProps.isActive}
                    interval={autoRefreshProps.interval}
                    lastRefresh={autoRefreshProps.lastRefresh}
                    onToggle={autoRefreshProps.onToggle}
                  />
                  <AutoRefreshSettings
                    currentInterval={autoRefreshProps.interval || 10 * 60 * 1000}
                    onIntervalChange={autoRefreshProps.onIntervalChange}
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <TransportTable
            initialTransports={transports}
            locations={locations}
            userRoles={userRoles}
            isAdmin={isAdmin}
            onRefresh={onRefresh}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Consola del Scraper */}
      <ScraperConsole 
        isOpen={isConsoleOpen} 
        onClose={() => setIsConsoleOpen(false)} 
      />
    </div>
  )
}
