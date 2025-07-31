"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Table, Terminal } from "lucide-react"
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

  // Manejar el evento de transporte añadido
  const handleTransportAdded = (newTransport: any) => {
    setTransports((prev) => [newTransport, ...prev])
  }

  return (
    <div className="space-y-6">
      {/* Card de Registro Rápido */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-blue-600" />
                Registro de Nuevas Entradas
              </CardTitle>
              <CardDescription>Registra nuevas entradas de vehículos al sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <TransportQuickForm
            locations={locations}
            onTransportAdded={handleTransportAdded}
            isSubmitting={isAddingTransport}
            setIsSubmitting={setIsAddingTransport}
          />
        </CardContent>
      </Card>

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
          {/* Botón para ver vehículos eliminados */}
          <div className="mb-4 flex justify-end">
            <CheckRemovedVehiclesButton />
          </div>
          
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
