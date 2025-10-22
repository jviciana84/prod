"use client"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  Search,
  RefreshCw,
  Settings,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Zap,
  TriangleAlert,
} from "lucide-react"
import { BatteryControlPrintExport } from "./battery-control-print-export"
import { toast } from "sonner"
import { differenceInDays, format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Tipos
interface BatteryVehicle {
  id: string
  vehicle_chassis: string
  vehicle_ecode: string | null
  vehicle_plate: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  vehicle_body: string | null
  vehicle_type: string // BEV o PHEV
  charge_percentage: number
  status: "pendiente" | "revisado"
  status_date: string | null
  is_charging: boolean
  observations: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  is_sold?: boolean // Para identificar si está en sales_vehicles
}

interface BatteryConfig {
  id: string
  days_to_reset: number
  days_alert_1: number
  xev_charge_ok: number
  xev_charge_sufficient: number
  xev_charge_insufficient: number
  phev_charge_ok: number
  phev_charge_sufficient: number
  phev_charge_insufficient: number
}

type VehicleTab = "disponibles" | "vendidos" | "insuficiente" | "suficiente" | "correcto"

interface BatteryControlTableProps {
  onRefresh?: () => void
}

export function BatteryControlTable({ onRefresh }: BatteryControlTableProps = {}) {
  const supabase = createClientComponentClient()

  // Estados
  const [vehicles, setVehicles] = useState<BatteryVehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentTab, setCurrentTab] = useState<VehicleTab>("disponibles")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [config, setConfig] = useState<BatteryConfig | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [tempValues, setTempValues] = useState<Record<string, any>>({})
  const [unavailableVehicles, setUnavailableVehicles] = useState<Set<string>>(new Set())

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Filtros
  const [motorTypeFilter, setMotorTypeFilter] = useState<"todos" | "termico" | "phev" | "bev" | "ice">("todos")

  // Función para determinar el nivel de carga
  const getChargeLevel = (vehicle: BatteryVehicle) => {
    if (!config) return "correcto"
    
    const percentage = vehicle.charge_percentage
    const type = vehicle.vehicle_type
    
    if (type === "BEV") {
      if (percentage >= config.xev_charge_ok) return "correcto"
      if (percentage >= config.xev_charge_sufficient) return "suficiente"
      return "insuficiente"
    } else if (type === "PHEV") {
      if (percentage >= config.phev_charge_ok) return "correcto"
      if (percentage >= config.phev_charge_sufficient) return "suficiente"
      return "insuficiente"
    }
    return "correcto"
  }

  // Config modal
  const [configForm, setConfigForm] = useState<Partial<BatteryConfig>>({})
  const [savingConfig, setSavingConfig] = useState(false)

  // Selección de filas
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  // Cargar rol del usuario
  useEffect(() => {
    loadUserRole()
  }, [])

  // Cargar datos
  useEffect(() => {
    loadData()
  }, [])

  const loadUserRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (profile) {
        setUserRole(profile.role)

        // Si es admin, cargar config
        if (profile.role === "admin" || profile.role === "administrador") {
          loadConfig()
        }
      }
    } catch (error) {
      console.error("Error cargando rol:", error)
    }
  }

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.from("battery_control_config").select("*").single()

      if (error) throw error
      setConfig(data)
      setConfigForm(data)
    } catch (error) {
      console.error("Error cargando configuración:", error)
    }
  }

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      console.log("🔋 Cargando datos de baterías...")

      // 1. Consultar vehículos BEV/PHEV desde duc_scraper
      const { data: ducVehicles, error: ducError } = await supabase
        .from("duc_scraper")
        .select(
          `"Chasis", "e-code", "Matrícula", "Marca", "Modelo", "Color Carrocería", "Carrocería", "Tipo motor", "Combustible", "Disponibilidad"`
        )
        .or('"Tipo motor".ilike.%BEV%,"Tipo motor".ilike.%PHEV%,"Tipo motor".ilike.%eléctric%,"Tipo motor".ilike.%electric%,"Combustible".ilike.%eléctric%,"Combustible".ilike.%electric%')

      if (ducError) throw ducError

      console.log("✅ Vehículos BEV/PHEV encontrados:", ducVehicles?.length || 0)

      // 2. Consultar datos existentes de battery_control
      const { data: batteryDataResult, error: batteryError } = await supabase
        .from("battery_control")
        .select("*")
        .order("updated_at", { ascending: false })

      if (batteryError) throw batteryError
      
      let batteryData = batteryDataResult

      // 3. Actualizar tipos de vehículos existentes si es necesario (OPTIMIZADO)
      let typesUpdated = false
      if (batteryData && batteryData.length > 0) {
        console.log("🔄 Verificando tipos de vehículos existentes...")
        
        // OPTIMIZACIÓN: Obtener TODOS los datos de duc_scraper en UNA sola consulta
        const chassisToCheck = batteryData.map(v => v.vehicle_chassis).filter(Boolean)
        
        if (chassisToCheck.length > 0) {
          const { data: ducVehiclesData } = await supabase
            .from("duc_scraper")
            .select(`"Chasis", "Tipo motor", "Combustible", "Modelo", "Marca"`)
            .in("Chasis", chassisToCheck)

          // Crear un mapa para acceso rápido
          const ducVehicleMap = new Map(
            ducVehiclesData?.map(v => [v.Chasis, v]) || []
          )

          // Array para acumular actualizaciones batch
          const updatesToProcess = []

          for (const vehicle of batteryData) {
            const ducVehicle = ducVehicleMap.get(vehicle.vehicle_chassis)

            if (ducVehicle) {
              const tipoMotor = (ducVehicle["Tipo motor"] || "").toUpperCase()
              const combustible = (ducVehicle["Combustible"] || "").toUpperCase()
              
              // Determinar el tipo correcto según especificación
              let correctType = "ICE"
              
              // LÓGICA: Priorizar "Tipo motor" sobre "Combustible"
              if (tipoMotor.includes("BEV") || tipoMotor.includes("ELÉCTRIC") && tipoMotor.includes("PURO")) {
                correctType = "BEV"
              }
              else if (tipoMotor.includes("PHEV") || tipoMotor.includes("HÍBRID") || tipoMotor.includes("HIBRID") || tipoMotor.includes("HYBRID")) {
                correctType = "PHEV"
              }
              else if (combustible.includes("ELÉCTRIC") || combustible.includes("ELECTRIC")) {
                correctType = "BEV"
              }
              else if (combustible.includes("HÍBRID") || combustible.includes("HIBRID") || combustible.includes("HYBRID")) {
                correctType = "PHEV"
              }
              else if (combustible.includes("GASOLINA") || combustible.includes("DIESEL")) {
                correctType = "ICE"
              }
              
              // Si el tipo es diferente, acumular para actualización
              if (vehicle.vehicle_type !== correctType) {
                updatesToProcess.push({
                  id: vehicle.id,
                  chassis: vehicle.vehicle_chassis,
                  oldType: vehicle.vehicle_type,
                  newType: correctType
                })
              }
            }
          }

          // OPTIMIZACIÓN: Actualizar en batch (paralelo)
          if (updatesToProcess.length > 0) {
            console.log(`🔄 Actualizando ${updatesToProcess.length} tipos de vehículos...`)
            
            await Promise.all(
              updatesToProcess.map(update =>
                supabase
                  .from("battery_control")
                  .update({ vehicle_type: update.newType })
                  .eq("id", update.id)
              )
            )
            
            typesUpdated = true
          }
        }
        
        // Si se actualizaron tipos, recargar datos de battery_control
        if (typesUpdated) {
          console.log("♻️ Recargando datos después de actualizar tipos...")
          const { data: updatedBatteryData } = await supabase
            .from("battery_control")
            .select("*")
            .order("updated_at", { ascending: false })
          
          if (updatedBatteryData) {
            batteryData = updatedBatteryData
          }
        }
      }

      // 4. Consultar vehículos vendidos
      const { data: soldVehicles, error: soldError } = await supabase
        .from("sales_vehicles")
        .select("license_plate")

      if (soldError) throw soldError

      const soldPlates = new Set(soldVehicles?.map((v) => v.license_plate) || [])

      // 5. Sincronizar: crear registros en battery_control si no existen
      if (ducVehicles && ducVehicles.length > 0) {
        const existingChassis = new Set(batteryData?.map((v) => v.vehicle_chassis).filter(Boolean) || [])
        
        console.log("🔍 Chasis existentes en battery_control:", existingChassis.size)
        console.log("🔍 Vehículos BEV/PHEV en duc_scraper:", ducVehicles.length)

        const newVehicles = ducVehicles.filter((v) => {
          const hasChasis = v.Chasis && v.Chasis.trim() !== ""
          const notExists = !existingChassis.has(v.Chasis)
          return hasChasis && notExists
        })

        if (newVehicles.length > 0) {
          console.log("🆕 Creando registros para nuevos vehículos:", newVehicles.length)

          const {
            data: { user },
          } = await supabase.auth.getUser()

          const inserts = newVehicles.map((v) => {
            // Determinar tipo según especificación
            let vehicleType = "ICE" // Por defecto ICE
            const tipoMotor = (v["Tipo motor"] || "").toUpperCase()
            const combustible = (v["Combustible"] || "").toUpperCase()
            
            // LÓGICA: Priorizar "Tipo motor" sobre "Combustible"
            if (tipoMotor.includes("BEV") || tipoMotor.includes("ELÉCTRIC") && tipoMotor.includes("PURO")) {
              vehicleType = "BEV"
            }
            else if (tipoMotor.includes("PHEV") || tipoMotor.includes("HÍBRID") || tipoMotor.includes("HIBRID") || tipoMotor.includes("HYBRID")) {
              vehicleType = "PHEV"
            }
            else if (combustible.includes("ELÉCTRIC") || combustible.includes("ELECTRIC")) {
              vehicleType = "BEV"
            }
            else if (combustible.includes("HÍBRID") || combustible.includes("HIBRID") || combustible.includes("HYBRID")) {
              vehicleType = "PHEV"
            }
            else if (combustible.includes("GASOLINA") || combustible.includes("DIESEL")) {
              vehicleType = "ICE"
            }

            return {
              vehicle_chassis: v.Chasis,
              vehicle_ecode: v["e-code"] || null,
              vehicle_plate: v["Matrícula"] || null,
              vehicle_brand: v.Marca || null,
              vehicle_model: v.Modelo || null,
              vehicle_color: v["Color Carrocería"] || null,
              vehicle_body: v.Carrocería || null,
              vehicle_type: vehicleType,
              charge_percentage: 0,
              status: "pendiente",
              is_charging: false,
              updated_by: user?.id || null,
            }
          })

          console.log("📝 Insertando registros nuevos:", inserts.length)

          const { data: insertedData, error: insertError } = await supabase
            .from("battery_control")
            .insert(inserts)
            .select()

          if (insertError) {
            console.error("❌ Error insertando nuevos vehículos:")
            console.error("Code:", insertError.code)
            console.error("Message:", insertError.message)
            console.error("Details:", insertError.details)
            console.error("Hint:", insertError.hint)
            toast.error(`Error al sincronizar vehículos: ${insertError.message}`)
          } else {
            console.log("✅ Vehículos insertados correctamente:", insertedData?.length || inserts.length)
            // Recargar datos después de insertar
            const { data: updatedBatteryData } = await supabase
              .from("battery_control")
              .select("*")
              .order("updated_at", { ascending: false })

            if (updatedBatteryData) {
              const vehiclesWithSoldFlag = updatedBatteryData.map((v) => ({
                ...v,
                is_sold: soldPlates.has(v.vehicle_plate),
              }))
              setVehicles(vehiclesWithSoldFlag)
            }
          }
        } else {
          // No hay nuevos, solo mapear los existentes
          const vehiclesWithSoldFlag = (batteryData || []).map((v) => ({
            ...v,
            is_sold: soldPlates.has(v.vehicle_plate),
          }))
          setVehicles(vehiclesWithSoldFlag)
        }
      } else {
        // No hay vehículos BEV/PHEV en duc_scraper
        const vehiclesWithSoldFlag = (batteryData || []).map((v) => ({
          ...v,
          is_sold: soldPlates.has(v.vehicle_plate),
        }))
        setVehicles(vehiclesWithSoldFlag)
      }

      console.log("✅ Datos de baterías cargados correctamente")
    } catch (error) {
      console.error("❌ Error cargando datos:", error)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    await loadData(true)
    if (onRefresh) {
      onRefresh()
    }
  }

  // Filtrar vehículos por pestaña, búsqueda y filtros
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles

    // Filtrar por pestaña de disponibilidad
    if (currentTab === "disponibles") {
      filtered = filtered.filter((v) => !v.is_sold)
    } else if (currentTab === "vendidos") {
      filtered = filtered.filter((v) => v.is_sold)
    }

    // Filtrar por pestaña de nivel de carga
    if (currentTab === "insuficiente") {
      filtered = filtered.filter((v) => getChargeLevel(v) === "insuficiente")
    } else if (currentTab === "suficiente") {
      filtered = filtered.filter((v) => getChargeLevel(v) === "suficiente")
    } else if (currentTab === "correcto") {
      filtered = filtered.filter((v) => getChargeLevel(v) === "correcto")
    }

    // Filtrar por tipo de motor
    if (motorTypeFilter !== "todos") {
      if (motorTypeFilter === "termico") {
        filtered = filtered.filter((v) => v.vehicle_type !== "BEV" && v.vehicle_type !== "PHEV")
      } else {
        filtered = filtered.filter((v) => v.vehicle_type.toLowerCase() === motorTypeFilter)
      }
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.vehicle_plate?.toLowerCase().includes(search) ||
          v.vehicle_chassis?.toLowerCase().includes(search) ||
          v.vehicle_model?.toLowerCase().includes(search) ||
          v.vehicle_brand?.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [vehicles, currentTab, searchTerm, motorTypeFilter, config])

  // Paginación
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredVehicles.slice(start, end)
  }, [filteredVehicles, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage)
  const totalRows = filteredVehicles.length

  // Función para obtener los números de página a mostrar (igual que gestión de ventas)
  const getPageNumbers = () => {
    const maxPagesToShow = 5
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let end = start + maxPagesToShow - 1
    if (end > totalPages) {
      end = totalPages
      start = Math.max(1, end - maxPagesToShow + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  // Resetear página si cambia el filtro o el tamaño
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage, filteredVehicles.length])

  // Función para manejar clic en fila
  const handleRowClick = (vehicleId: string, event: React.MouseEvent) => {
    // No deseleccionar si se hace clic en elementos interactivos
    const target = event.target as Element
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest('[role="combobox"]') ||
      target.closest("span[onClick]") ||
      target.closest("a") ||
      target.closest('[data-interactive]')
    ) {
      return
    }

    setSelectedRowId(selectedRowId === vehicleId ? null : vehicleId)
  }

  // Obtener color del indicador de batería
  const getBatteryIndicator = (vehicle: BatteryVehicle) => {
    if (!config) return { color: "bg-gray-500", icon: Battery }

    const percentage = vehicle.charge_percentage
    const type = vehicle.vehicle_type

    if (type === "BEV") {
      if (percentage >= config.xev_charge_ok) {
        return { color: "bg-green-500", icon: Battery, label: "Correcto" }
      } else if (percentage >= config.xev_charge_sufficient) {
        return { color: "bg-amber-500", icon: BatteryWarning, label: "Suficiente" }
      } else {
        return { color: "bg-red-500", icon: BatteryWarning, label: "Insuficiente" }
      }
    } else {
      // PHEV
      if (percentage >= config.phev_charge_ok) {
        return { color: "bg-green-500", icon: Battery, label: "Correcto" }
      } else if (percentage >= config.phev_charge_sufficient) {
        return { color: "bg-amber-500", icon: BatteryWarning, label: "Suficiente" }
      } else {
        return { color: "bg-red-500", icon: BatteryWarning, label: "Insuficiente" }
      }
    }
  }

  // Obtener color del ping (alerta)
  const getAlertPing = (vehicle: BatteryVehicle) => {
    if (!config) return null

    // PRIORIDAD 1: Carga insuficiente SIEMPRE ping rojo
    const chargeLevel = getChargeLevel(vehicle)
    if (chargeLevel === "insuficiente") {
      return "bg-red-500" // Ping rojo - Carga insuficiente
    }

    // PRIORIDAD 2: Estado pendiente ping rojo
    if (vehicle.status === "pendiente") {
      return "bg-red-500" // Ping rojo - Alerta 2
    }

    // PRIORIDAD 3: Días sin revisar ping ámbar
    if (vehicle.status_date) {
      const daysSinceReview = differenceInDays(new Date(), new Date(vehicle.status_date))
      if (daysSinceReview >= config.days_alert_1) {
        return "bg-amber-500" // Ping ámbar - Alerta 1
      }
    }

    return null
  }

  // Verificar si el vehículo no está disponible (sin datos de batería)
  const isVehicleUnavailable = (vehicle: BatteryVehicle) => {
    return !vehicle.battery_level && !vehicle.battery_voltage && !vehicle.battery_current
  }

  // Toggle estado de vehículo no disponible
  const toggleUnavailable = (vehicleId: string) => {
    setUnavailableVehicles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId)
      } else {
        newSet.add(vehicleId)
      }
      return newSet
    })
  }

  // Actualizar campo
  const handleUpdateField = async (id: string, field: string, value: any) => {
    try {
      const response = await fetch("/api/battery-control/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          data: { [field]: value },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al actualizar")
      }

      // Actualizar estado local
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                [field]: value,
                ...(field === "status" && value === "revisado" ? { status_date: new Date().toISOString() } : {}),
              }
            : v
        )
      )

      toast.success("Actualizado correctamente")
    } catch (error: any) {
      console.error("Error actualizando:", error)
      toast.error(error.message || "Error al actualizar")
    }
  }

  // Toggle estado
  const handleToggleStatus = async (vehicle: BatteryVehicle) => {
    if (vehicle.status === "revisado") {
      // Si ya está revisado, solo actualizar la fecha (reiniciar contador)
      const currentDate = new Date().toISOString()
      console.log("🔄 Actualizando fecha de revisión (reinicio de contador):", currentDate)
      await handleUpdateField(vehicle.id, "status_date", currentDate)
      toast.success("Fecha de revisión actualizada")
    } else {
      // Si está pendiente, cambiar a revisado
      await handleUpdateField(vehicle.id, "status", "revisado")
      
      // Actualizar la fecha de revisión
      const currentDate = new Date().toISOString()
      console.log("✅ Cambiando a revisado con fecha:", currentDate)
      await handleUpdateField(vehicle.id, "status_date", currentDate)
      
      // Si estaba cargando, dejarlo como estaba (ya no forzar a false)
    }
  }

  // Guardar configuración
  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      const response = await fetch("/api/battery-control/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar configuración")
      }

      const { data } = await response.json()
      setConfig(data)
      toast.success("Configuración guardada correctamente")
      setShowConfigModal(false)
    } catch (error: any) {
      console.error("Error guardando config:", error)
      toast.error(error.message || "Error al guardar configuración")
    } finally {
      setSavingConfig(false)
    }
  }

  // Edición inline
  const startEditing = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field })
    setTempValues({ ...tempValues, [`${id}-${field}`]: currentValue })
  }

  const saveEditing = async () => {
    if (!editingCell) return

    const key = `${editingCell.id}-${editingCell.field}`
    const value = tempValues[key]

    await handleUpdateField(editingCell.id, editingCell.field, value)
    setEditingCell(null)
  }

  const cancelEditing = () => {
    setEditingCell(null)
  }

  const isAdmin = userRole === "admin" || userRole === "administrador"

  return (
    <div className="space-y-4">
      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as VehicleTab)} className="w-full">
        {/* Barra superior con buscador y pestañas en la misma línea */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Card className="p-3">
              <div className="flex items-center gap-2 relative">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por marca, matrícula, chasis, modelo..."
                  className="w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Card>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 w-9"
              title="Actualizar"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowConfigModal(true)}
                className="h-9 w-9"
                title="Configuración"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <BatteryControlPrintExport
              vehicles={filteredVehicles}
              activeTab={currentTab}
              searchQuery={searchTerm}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Selector de tipo de motor */}
            <Select value={motorTypeFilter} onValueChange={(value: any) => setMotorTypeFilter(value)}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="termico">Térmico</SelectItem>
                <SelectItem value="phev">PHEV</SelectItem>
                <SelectItem value="bev">BEV</SelectItem>
                <SelectItem value="ice">ICE</SelectItem>
              </SelectContent>
            </Select>

            {/* TODAS las pestañas en un solo TabsList */}
            <TabsList className="h-9 bg-muted/50">
              <TabsTrigger value="disponibles" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <Battery className="h-3.5 w-3.5 mr-1" />
                <span>Disponibles</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">
                  {vehicles.filter((v) => !v.is_sold).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="vendidos" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                <span>Vendidos</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">
                  {vehicles.filter((v) => v.is_sold).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="insuficiente" 
                className="px-3 py-1 h-7 data-[state=active]:bg-background"
              >
                <span>Insuficiente</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">
                  {vehicles.filter((v) => getChargeLevel(v) === "insuficiente").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="suficiente" 
                className="px-3 py-1 h-7 data-[state=active]:bg-background"
              >
                <span>Suficiente</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">
                  {vehicles.filter((v) => getChargeLevel(v) === "suficiente").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="correcto" 
                className="px-3 py-1 h-7 data-[state=active]:bg-background"
              >
                <span>Correcto</span>
                <Badge variant="outline" className="ml-1 text-xs px-1 py-0">
                  {vehicles.filter((v) => getChargeLevel(v) === "correcto").length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {["disponibles", "vendidos", "insuficiente", "suficiente", "correcto"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            {loading ? (
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
                  <span>Cargando vehículos...</span>
                </div>
              </div>
            ) : paginatedVehicles.length === 0 ? (
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <div className="text-center py-12 text-muted-foreground">
                  <Battery className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No hay vehículos {tab === "vendidos" ? "vendidos" : "disponibles"}</p>
                </div>
              </div>
            ) : (
              <>
              {/* Tabla */}
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-b border-border">
                        <TableHead className="truncate py-2 px-2">MARCA</TableHead>
                        <TableHead className="truncate py-2 px-2">CHASIS</TableHead>
                        <TableHead className="truncate py-2 px-2">E-CODE</TableHead>
                        <TableHead className="truncate py-2 px-2">MATRÍCULA</TableHead>
                        <TableHead className="truncate py-2 px-2">MODELO</TableHead>
                        <TableHead className="truncate py-2 px-2">COLOR</TableHead>
                        <TableHead className="truncate py-2 px-2">TIPO / NIVEL</TableHead>
                        <TableHead className="w-24 truncate py-2 px-2">% CARGA</TableHead>
                        <TableHead className="truncate py-2 px-2">ESTADO</TableHead>
                        <TableHead className="truncate py-2 px-2">CARGANDO</TableHead>
                        <TableHead className="truncate py-2 px-2">OBSERVACIONES</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {paginatedVehicles.map((vehicle) => {
                      const alertPing = getAlertPing(vehicle)
                      const batteryIndicator = getBatteryIndicator(vehicle)
                      const BatteryIcon = batteryIndicator.icon

                      return (
                        <TableRow
                          key={vehicle.id}
                          className={cn(
                            "font-medium transition-all duration-300 ease-in-out cursor-pointer border-b relative",
                            selectedRowId === vehicle.id
                              ? "border-2 border-primary shadow-md bg-primary/5"
                              : "even:bg-muted/50 hover:bg-muted/30"
                          )}
                          data-selected={selectedRowId === vehicle.id}
                          onClick={(e) => handleRowClick(vehicle.id, e)}
                        >
                          {/* Marca (con ping de alerta) */}
                          <TableCell className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              {alertPing && (
                                <span className="relative flex h-3 w-3 flex-shrink-0">
                                  <span
                                    className={cn(
                                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                      alertPing
                                    )}
                                  />
                                  <span className={cn("relative inline-flex rounded-full h-3 w-3", alertPing)} />
                                </span>
                              )}
                              <span>{vehicle.vehicle_brand || "-"}</span>
                            </div>
                          </TableCell>

                          {/* Chasis */}
                          <TableCell className="font-mono text-xs py-2 px-2">{vehicle.vehicle_chassis}</TableCell>

                          {/* e-code */}
                          <TableCell className="font-mono text-xs py-2 px-2">{vehicle.vehicle_ecode || "-"}</TableCell>

                          {/* Matrícula */}
                          <TableCell className="py-2 px-2">{vehicle.vehicle_plate || "-"}</TableCell>

                          {/* Modelo */}
                          <TableCell className="py-2 px-2">{vehicle.vehicle_model || "-"}</TableCell>

                          {/* Color */}
                          <TableCell className="py-2 px-2">{vehicle.vehicle_color || "-"}</TableCell>

                          {/* Tipo / Nivel */}
                          <TableCell className="py-2 px-2">
                            <div className="flex flex-col gap-1 items-center">
                              {/* Tipo (arriba) */}
                              {vehicle.vehicle_type === "BEV" ? (
                                <Badge variant="default" className="w-full justify-center">
                                  <Zap className="h-3 w-3 mr-1" />
                                  BEV
                                </Badge>
                              ) : (
                                <Badge className="w-full justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:from-green-600 hover:to-blue-600">
                                  <BatteryCharging className="h-3 w-3 mr-1" />
                                  PHEV
                                </Badge>
                              )}
                              {/* Nivel (abajo) */}
                              <div className="flex items-center gap-1">
                                <BatteryIcon className={cn("h-4 w-4", batteryIndicator.color.replace("bg-", "text-"))} />
                                <span className="text-xs text-muted-foreground">{batteryIndicator.label}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* % Carga */}
                          <TableCell className="py-2 px-2">
                            {editingCell?.id === vehicle.id && editingCell?.field === "charge_percentage" ? (
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={tempValues[`${vehicle.id}-charge_percentage`] || 0}
                                onChange={(e) =>
                                  setTempValues({
                                    ...tempValues,
                                    [`${vehicle.id}-charge_percentage`]: parseInt(e.target.value) || 0,
                                  })
                                }
                                onBlur={saveEditing}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditing()
                                  if (e.key === "Escape") cancelEditing()
                                }}
                                className="w-20"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer border border-input bg-background rounded-md px-3 py-2 text-sm hover:border-primary transition-colors"
                                onClick={() => startEditing(vehicle.id, "charge_percentage", vehicle.charge_percentage)}
                              >
                                <span className="font-semibold">{vehicle.charge_percentage}%</span>
                              </div>
                            )}
                          </TableCell>

                          {/* Estado */}
                          <TableCell className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              {/* Botón de estado */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleStatus(vehicle)}
                                className={cn(
                                  "gap-1 w-[130px] justify-center",
                                  unavailableVehicles.has(vehicle.id)
                                    ? "border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                                    : vehicle.status === "revisado"
                                    ? "border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                    : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                )}
                              >
                                {unavailableVehicles.has(vehicle.id) ? (
                                  <>
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-sm">NO DISPONIBLE</span>
                                  </>
                                ) : vehicle.status === "revisado" ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span className="text-sm">
                                      {vehicle.status_date 
                                        ? format(new Date(vehicle.status_date), "dd/MM/yyyy")
                                        : "Revisado"
                                      }
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-sm">Pendiente</span>
                                  </>
                                )}
                              </Button>
                              
                              {/* Botón pequeño de alerta a la derecha (sin borde) */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleUnavailable(vehicle.id)
                                }}
                                className="h-6 w-6 p-0 hover:bg-muted/50 rounded"
                                title="Marcar como no disponible"
                              >
                                <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
                              </Button>
                            </div>
                          </TableCell>

                          {/* Cargando */}
                          <TableCell className="py-2 px-2">
                            <Select
                              value={vehicle.is_charging ? "si" : "no"}
                              onValueChange={(value) => handleUpdateField(vehicle.id, "is_charging", value === "si")}
                              disabled={vehicle.status === "pendiente"}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="si">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Observaciones */}
                          <TableCell className="py-2 px-2 max-w-[250px]">
                            {editingCell?.id === vehicle.id && editingCell?.field === "observations" ? (
                              <Input
                                value={tempValues[`${vehicle.id}-observations`] || ""}
                                onChange={(e) =>
                                  setTempValues({
                                    ...tempValues,
                                    [`${vehicle.id}-observations`]: e.target.value,
                                  })
                                }
                                onBlur={saveEditing}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditing()
                                  if (e.key === "Escape") cancelEditing()
                                }}
                                className="w-full"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer border border-input bg-background rounded-md px-3 py-2 text-sm w-full hover:border-primary transition-colors truncate"
                                onClick={() => startEditing(vehicle.id, "observations", vehicle.observations || "")}
                                title={vehicle.observations || ""}
                              >
                                <span className={vehicle.observations ? "" : "text-muted-foreground italic"}>
                                  {vehicle.observations || "Click para añadir observaciones..."}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  </Table>
                </div>
              </div>

              {/* Subcard paginador (igual que gestión de ventas) */}
              <div className="mt-2 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {totalRows === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                  -{Math.min(currentPage * itemsPerPage, totalRows)} de <span className="font-bold">{totalRows}</span> resultados
                </div>
                <div className="flex items-center gap-2">
                  {/* Selector de filas por página a la izquierda */}
                  <div className="flex items-center gap-1 mr-4">
                    <span className="text-xs">Filas por página:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Flechas y números de página */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                  >
                    {"<<"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                  >
                    {"<"}
                  </Button>
                  {getPageNumbers().map((n) => (
                    <Button
                      key={n}
                      variant={n === currentPage ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCurrentPage(n)}
                      className="h-8 w-8 font-bold"
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8"
                  >
                    {">"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8"
                  >
                    {">>"}
                  </Button>
                </div>
              </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal de configuración (solo admin) */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Control de Baterías
            </DialogTitle>
            <DialogDescription>Ajusta los parámetros de alertas y niveles de carga</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Reinicio y alertas */}
            <div className="space-y-4">
              <h3 className="font-semibold">Alertas y Reinicio</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Días para reiniciar a pendiente</Label>
                  <Input
                    type="number"
                    min="1"
                    value={configForm.days_to_reset || 7}
                    onChange={(e) => setConfigForm({ ...configForm, days_to_reset: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Días para alerta ámbar</Label>
                  <Input
                    type="number"
                    min="1"
                    value={configForm.days_alert_1 || 3}
                    onChange={(e) => setConfigForm({ ...configForm, days_alert_1: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Niveles BEV */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Niveles de carga BEV (100% eléctricos)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-500">✓ Correcto (≥%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={configForm.xev_charge_ok || 80}
                    onChange={(e) => setConfigForm({ ...configForm, xev_charge_ok: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-500">⚠ Suficiente (≥%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={configForm.xev_charge_sufficient || 50}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, xev_charge_sufficient: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-500">✗ Insuficiente (&lt;%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={configForm.xev_charge_insufficient || 30}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, xev_charge_insufficient: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Niveles PHEV */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BatteryCharging className="h-4 w-4 text-blue-500" />
                Niveles de carga PHEV (híbridos enchufables)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-500">✓ Correcto (≥%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={configForm.phev_charge_ok || 70}
                    onChange={(e) => setConfigForm({ ...configForm, phev_charge_ok: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-500">⚠ Suficiente (≥%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={configForm.phev_charge_sufficient || 40}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, phev_charge_sufficient: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-500">✗ Insuficiente (&lt;%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={configForm.phev_charge_insufficient || 20}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, phev_charge_insufficient: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar configuración"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

