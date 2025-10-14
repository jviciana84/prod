"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Search, RefreshCw } from "lucide-react"

import Link from "next/link"
import { useRouter } from "next/navigation" // Importar useRouter

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Send,
  Loader2,
  Trophy,
  Eye,
  AlertCircle,
  ChevronDown,
  Car,
  Wrench,
  Sparkles,
  Key,
  FileText,
  FileCheck,
  CreditCard,
  Truck,
} from "lucide-react"
import { parse, isValid } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Entrega, TipoIncidencia } from "@/types/entregas"
import { enviarEntregaAIncentivos } from "@/server-actions/incentivos-actions"
import { formatDateForDisplay } from "@/lib/date-utils"
import { getUserAsesorAlias } from "@/lib/user-mapping-improved"
import { ReusablePagination } from "@/components/ui/reusable-pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DateFilter } from "@/components/ui/date-filter"
import { PrintExportButton } from "./print-export-button"

// Tipo de pestaña
type EntregaTab = "todas" | "con_incidencia" | "sin_incidencia" | "pendientes" | "docu_no_entregada"

// Tipos de incidencias disponibles
const TIPOS_INCIDENCIA: TipoIncidencia[] = [
  "Carrocería",
  "Mecánica",
  "Limpieza",
  "2ª llave",
  "CardKey",
  "Ficha técnica",
  "Permiso circulación",
]

interface EntregasTableProps {
  onRefreshRequest?: () => void
}

type EditingCell = {
  id: string
  field: "fecha_entrega" | "observaciones"
} | null

export function EntregasTable({ onRefreshRequest }: EntregasTableProps) {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [filteredEntregas, setFilteredEntregas] = useState<Entrega[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [activeTab, setActiveTab] = useState<EntregaTab>("todas")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginatedEntregas, setPaginatedEntregas] = useState<Entrega[]>([])
  const [totalPages, setTotalPages] = useState(1)

  const [counts, setCounts] = useState({
    todas: 0,
    con_incidencia: 0,
    sin_incidencia: 0,
    pendientes: 0,
    docu_no_entregada: 0,
  })

  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviandoIncentivo, setEnviandoIncentivo] = useState<string | null>(null)
  const [enviandoEmail, setEnviandoEmail] = useState<string | null>(null)

  // Estados para el filtro de fechas temporal
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // Estados para el usuario y perfil
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const supabase = createClientComponentClient()
  const router = useRouter() // Inicializar useRouter

  const formatDateDisplay = (dateString: string | undefined | null) => {
    return formatDateForDisplay(dateString)
  }

  // Función para obtener el usuario y perfil actual
  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { user }, // <--- CAMBIO AQUÍ: de session a user
        } = await supabase.auth.getUser() // <--- CAMBIO AQUÍ: de getSession() a getUser()

        if (user) {
          // <--- CAMBIO AQUÍ: de session?.user a user
          setUser(user)

          // Obtener el perfil del usuario
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id) // Asegúrate de que user.id se usa aquí
            .single()

          if (profileError) {
            console.error("Error al obtener perfil:", profileError)
          } else {
            setProfile(profileData)
            console.log("✅ Perfil cargado:", profileData)
          }
        }
      } catch (error) {
        console.error("Error al obtener usuario:", error)
      } finally {
        setAuthLoading(false)
      }
    }

    getUser()
  }, [])

  useEffect(() => {
    // Solo cargar entregas si la autenticación ha terminado de cargar
    console.log("🔄 useEffect triggered - authLoading:", authLoading, "user:", !!user, "profile:", !!profile)
    if (!authLoading) {
      console.log("✅ Auth loading completado, cargando entregas...")
      loadEntregas()
    } else {
      console.log("⏳ Auth aún cargando...")
    }
  }, [user, profile, authLoading])

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCell])

  const loadEntregas = async () => {
    setLoading(true)
    console.log("🚀 Iniciando carga de entregas...")
    try {
      // TEMPORAL: Cargar todas las entregas sin filtros para diagnosticar
      console.log("🔍 Cargando TODAS las entregas (diagnóstico)...")
      let query = supabase.from("entregas").select("*").order("fecha_venta", { ascending: false })

      // Determinar si el usuario es administrador o supervisor
      const userRole = profile?.role?.toLowerCase() || ""
      const isAdmin = ["admin", "administrador", "director", "supervisor"].includes(userRole)
      const isAsesor = ["asesor", "asesor ventas", "asesor comercial"].includes(userRole)

      console.log("🔍 Debug info:")
      console.log("- User:", user?.email)
      console.log("- Profile:", profile)
      console.log("- User role:", userRole)
      console.log("- Is Admin:", isAdmin)
      console.log("- Is Asesor:", isAsesor)

      // Aplicar filtros según el rol del usuario
      if (isAdmin) {
        // Admin y Supervisor ven todas las entregas
        console.log("👑 Modo administrador/supervisor - mostrando todas las entregas")
        toast.info("Mostrando todas las entregas (modo administrador/supervisor)")
      } else if (isAsesor && profile?.full_name) {
        // Asesor ve solo sus entregas - usar mapeo de nombres
        console.log("🔍 Buscando mapeo para asesor...")
        const asesorAlias = await getUserAsesorAlias(user.id, profile.full_name, user.email)

        console.log("🔍 Mapeo de asesor:")
        console.log("- Nombre en perfil:", profile.full_name)
        console.log("- Alias encontrado:", asesorAlias)

        if (asesorAlias) {
          // Usar ilike para comparación insensible a mayúsculas/minúsculas
          query = query.ilike("asesor", asesorAlias)
          console.log(`✅ Filtro aplicado: asesor ILIKE ${asesorAlias}`)
          toast.info(`Mostrando entregas para: ${asesorAlias} (${profile.full_name})`)
        } else {
          console.log("❌ No se encontró mapeo para el asesor")
          toast.warning(
            `No se encontró mapeo para ${profile.full_name}. Contacte al administrador para configurar el mapeo.`,
          )
          setEntregas([])
          actualizarContadores([])
          setLoading(false)
          return
        }
      } else if (!isAdmin && !profile?.full_name) {
        // Usuario sin nombre completo
        console.log("❌ Usuario sin nombre completo en perfil")
        toast.warning("No se pudo determinar el asesor. Contacte al administrador.")
        setEntregas([])
        actualizarContadores([])
        setLoading(false)
        return
      } else {
        // Otros roles - mostrar mensaje informativo
        console.log(`ℹ️ Rol no reconocido: ${userRole}`)
        toast.info(`Rol: ${userRole}. Si debería ver entregas, contacte al administrador.`)
        setEntregas([])
        actualizarContadores([])
        setLoading(false)
        return
      }
      
      console.log("🔍 Ejecutando consulta con filtros aplicados...")

      console.log("🔍 Ejecutando consulta a la base de datos...")
      const { data, error } = await query

      if (error) {
        console.error("❌ Error al cargar entregas:", error)
        toast.error("Error al cargar los datos: " + error.message)
        setEntregas([])
        actualizarContadores([])
        setLoading(false)
        return
      }

      console.log("📊 Resultados de la consulta:")
      console.log("- Data:", data)
      console.log("- Data length:", data?.length || 0)

      if (data && data.length > 0) {
        const formattedData: Entrega[] = data.map((item) => ({
          id: item.id,
          fecha_venta: item.fecha_venta,
          fecha_entrega: item.fecha_entrega,
          matricula: item.matricula || "",
          modelo: item.modelo || "",
          asesor: item.asesor || "",
          or: item.or || "",
          incidencia: item.incidencia || false,
          tipos_incidencia: item.tipos_incidencia || [],
          observaciones: item.observaciones || "",
          enviado_a_incentivos: Boolean(item.enviado_a_incentivos),
          email_enviado: Boolean(item.email_enviado),
          email_enviado_at: item.email_enviado_at || null,
        }))

        console.log(`✅ Entregas cargadas: ${formattedData.length}`)
        setEntregas(formattedData)
        actualizarContadores(formattedData)

        if (formattedData.length === 0) {
          toast.info("No se encontraron entregas para tu perfil.")
        } else {
          toast.success(`Se encontraron ${formattedData.length} entregas`)
        }
      } else {
        console.log("ℹ️ No hay datos de entregas")
        setEntregas([])
        actualizarContadores([])
        toast.info("No se encontraron entregas.")
      }
    } catch (err: any) {
      console.error("❌ Error inesperado:", err)
      toast.error("Error al cargar los datos: " + err.message)
      setEntregas([])
      actualizarContadores([])
    } finally {
      setLoading(false)
    }
  }

  const actualizarContadores = (data: Entrega[]) => {
    setCounts({
      todas: data.length,
      con_incidencia: data.filter((v) => v.incidencia === true || (v.tipos_incidencia && v.tipos_incidencia.length > 0))
        .length,
      sin_incidencia: data.filter(
        (v) => v.incidencia === false && (!v.tipos_incidencia || v.tipos_incidencia.length === 0),
      ).length,
      pendientes: data.filter((v) => !v.fecha_entrega && !v.email_enviado).length,
      docu_no_entregada: data.filter((v) => !v.fecha_entrega).length,
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadEntregas()
    setRefreshing(false)
    if (onRefreshRequest) onRefreshRequest()
  }

  const toggleTipoIncidencia = async (entregaId: string, tipo: TipoIncidencia) => {
    const entregaToUpdate = entregas.find((e) => e.id === entregaId)
    if (!entregaToUpdate) {
      toast.error(`Entrega con ID ${entregaId} no encontrada.`)
      return
    }

    const isTipoPresente = entregaToUpdate.tipos_incidencia?.includes(tipo)
    const nuevosTiposIncidencia: TipoIncidencia[] = isTipoPresente
      ? entregaToUpdate.tipos_incidencia.filter((t) => t !== tipo)
      : [...(entregaToUpdate.tipos_incidencia || []), tipo]

    const updateObject = {
      tipos_incidencia: nuevosTiposIncidencia,
      incidencia: nuevosTiposIncidencia.length > 0,
    }

    // Actualización optimista del estado local
    setEntregas((prev) => prev.map((e) => (e.id === entregaId ? { ...e, ...updateObject } : e)))

    try {
      const { error: dbError } = await supabase.from("entregas").update(updateObject).eq("id", entregaId)
      if (dbError) throw dbError

      // Actualizar historial de incidencias
      if (isTipoPresente) {
        // Se está quitando/resolviendo una incidencia
        const { error: updateHistorialError } = await supabase
          .from("incidencias_historial")
          .update({ resuelta: true, fecha_resolucion: new Date().toISOString() })
          .eq("matricula", entregaToUpdate.matricula)
          .eq("tipo_incidencia", tipo)
          .eq("resuelta", false)

        if (updateHistorialError) console.error("Error al marcar incidencia como resuelta:", updateHistorialError)
      } else {
        // Se está añadiendo una nueva incidencia
        const { error: insertHistorialError } = await supabase.from("incidencias_historial").insert({
          entrega_id: entregaId,
          matricula: entregaToUpdate.matricula,
          tipo_incidencia: tipo,
          accion: "añadida",
          resuelta: false,
          fecha: new Date().toISOString(),
        })
        if (insertHistorialError)
          console.error("Error al registrar nueva incidencia en historial:", insertHistorialError)
      }

      toast.success(`${isTipoPresente ? "Eliminada" : "Añadida"} incidencia "${tipo}"`)
    } catch (error: any) {
      toast.error("Error al actualizar incidencia: " + error.message)
      // Revertir el cambio optimista si falla la BD
      setEntregas((prevEntregas) => {
        const originalEntrega = prevEntregas.find((e) => e.id === entregaId)
        if (originalEntrega) {
          return prevEntregas.map((e) =>
            e.id === entregaId
              ? { ...e, tipos_incidencia: entregaToUpdate.tipos_incidencia, incidencia: entregaToUpdate.incidencia }
              : e,
          )
        }
        return prevEntregas
      })
    }
  }

  const handleCellClick = (entrega: Entrega, field: "fecha_entrega" | "observaciones") => {
    setEditingCell({ id: entrega.id, field })
    if (field === "fecha_entrega") {
      setEditValue(entrega.fecha_entrega ? formatDateDisplay(entrega.fecha_entrega) : "")
    } else {
      setEditValue(entrega.observaciones || "")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingCell?.field === "fecha_entrega") {
      let value = e.target.value.replace(/[^0-9/]/g, "") // Permitir números y /
      const parts = value.split("/").map((part) => part.replace(/[^0-9]/g, "")) // Limpiar cada parte

      if (value.length > 10) value = value.substring(0, 10) // dd/mm/yyyy

      // Formateo automático
      const numbersOnly = value.replace(/\//g, "")
      let formattedValue = ""
      if (numbersOnly.length > 0) {
        formattedValue += numbersOnly.substring(0, 2)
      }
      if (numbersOnly.length >= 3) {
        formattedValue += "/" + numbersOnly.substring(2, 4)
      }
      if (numbersOnly.length >= 5) {
        formattedValue += "/" + numbersOnly.substring(4, 8)
      }
      setEditValue(formattedValue)
    } else {
      setEditValue(e.target.value)
    }
  }

  const handleInputBlur = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (!editingCell) return

      const { id, field } = editingCell
      const updateData: Partial<Entrega> = {}
      let finalValue: any = editValue

      if (field === "fecha_entrega") {
        if (!editValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          toast.error("Formato de fecha inválido. Use DD/MM/AAAA.")
          return
        }
        const parsedDate = parse(editValue, "dd/MM/yyyy", new Date())
        if (!isValid(parsedDate)) {
          toast.error("Fecha inválida.")
          return
        }

        // Validar que la fecha no sea futura
        const today = new Date()
        today.setHours(23, 59, 59, 999) // Final del día actual
        if (parsedDate > today) {
          toast.error("No se puede establecer una fecha de entrega futura.")
          return
        }

        // CORREGIDO: Usar mediodía para evitar problemas de zona horaria
        parsedDate.setHours(12, 0, 0, 0)
        finalValue = parsedDate.toISOString()
        updateData.fecha_entrega = finalValue
      } else {
        updateData.observaciones = editValue
      }

      try {
        const { data, error } = await supabase.from("entregas").update(updateData).eq("id", id).select().single()
        if (error) throw error

        setEntregas((prev) => prev.map((item) => (item.id === id ? { ...item, ...updateData } : item)))
        toast.success(`${field === "fecha_entrega" ? "Fecha de entrega" : "Observaciones"} actualizada.`)
        setEditingCell(null)
        setEditValue("")
      } catch (error: any) {
        toast.error(`Error al actualizar: ${error.message}`)
      }
    } else if (e.key === "Escape") {
      setEditingCell(null)
      setEditValue("")
    }
  }

  const handleTrophyClick = async (entrega: Entrega) => {
    console.log("🎯 handleTrophyClick llamado con entrega:", entrega)
    
    // Validar que tenga fecha de entrega
    if (!entrega.fecha_entrega) {
      toast.error("La entrega debe tener fecha de entrega para enviar a incentivos")
      return
    }
    
    setEnviandoIncentivo(entrega.id)

    try {
      console.log("📤 Enviando a incentivos:", {
        matricula: entrega.matricula,
        modelo: entrega.modelo,
        asesor: entrega.asesor,
        fechaEntrega: entrega.fecha_entrega,
        or: entrega.or,
      })

      const result = await enviarEntregaAIncentivos(
        entrega.matricula,
        entrega.modelo,
        entrega.asesor,
        entrega.fecha_entrega,
        entrega.or, // Asegúrate de que este campo se llama 'or' en tu tabla 'entregas'
      )

      console.log("📥 Resultado de enviarEntregaAIncentivos:", result)

      if (result.success) {
        toast.success(result.message)
        // Actualizar el estado local
        setEntregas((prev) => prev.map((e) => (e.id === entrega.id ? { ...e, enviado_a_incentivos: true } : e)))
      } else {
        toast.error(result.message) // Cambiado de result.error a result.message para consistencia
      }
    } catch (error: any) {
      console.error("❌ Error en handleTrophyClick:", error)
      toast.error("Error al enviar a incentivos: " + error.message)
    } finally {
      setEnviandoIncentivo(null)
    }
  }

  const handleEnviarEmail = async (entrega: Entrega) => {
    if (!entrega.fecha_entrega) {
      toast.error("La entrega debe tener fecha de entrega para enviar notificación")
      return
    }

    if (entrega.email_enviado) {
      toast.error("El email ya fue enviado para esta entrega")
      return
    }

    setEnviandoEmail(entrega.id)

    try {
      const response = await fetch("/api/entregas/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entregaId: entrega.id,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Email de entrega enviado exitosamente")
        // Actualizar el estado local
        setEntregas((prev) =>
          prev.map((e) =>
            e.id === entrega.id ? { ...e, email_enviado: true, email_enviado_at: new Date().toISOString() } : e,
          ),
        )
      } else {
        toast.error(result.error || "Error enviando email")
      }
    } catch (error: any) {
      toast.error("Error enviando email: " + error.message)
    } finally {
      setEnviandoEmail(null)
    }
  }

  const handleSolicitarRecogida = (entrega: Entrega) => {
    // Redirigir a la página de recogidas con la matrícula preseleccionada
    router.push(`/dashboard/recogidas?matricula=${entrega.matricula}`)
  }

  // Función para aplicar filtro de fechas temporal
  const applyDateRangeFilter = (data: Entrega[]) => {
    if (!dateRange.from && !dateRange.to) {
      return data
    }

    return data.filter((entrega) => {
      const entregaDate = new Date(entrega.fecha_venta)
      
      if (dateRange.from && entregaDate < dateRange.from) {
        return false
      }
      
      if (dateRange.to && entregaDate > dateRange.to) {
        return false
      }
      
      return true
    })
  }

  // Función para limpiar filtro de fechas
  const clearDateRangeFilter = () => {
    setDateRange({ from: undefined, to: undefined })
  }

  // Aplicar filtros y actualizar contadores
  useEffect(() => {
    let filtered = [...entregas]

    // Filtrar por pestaña activa
    if (activeTab === "con_incidencia") {
      filtered = filtered.filter((e) => e.tipos_incidencia && e.tipos_incidencia.length > 0)
    } else if (activeTab === "sin_incidencia") {
      filtered = filtered.filter((e) => !e.tipos_incidencia || e.tipos_incidencia.length === 0)
    } else if (activeTab === "pendientes") {
      filtered = filtered.filter((e) => !e.fecha_entrega)
    } else if (activeTab === "docu_no_entregada") {
      filtered = filtered.filter((e) => e.tipos_incidencia && e.tipos_incidencia.some((t) => ["2ª llave", "CardKey", "Ficha técnica", "Permiso circulación"].includes(t)))
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.matricula?.toLowerCase().includes(query) ||
          e.modelo?.toLowerCase().includes(query) ||
          e.asesor?.toLowerCase().includes(query) ||
          e.or?.toLowerCase().includes(query),
      )
    }

    // Aplicar filtro de fechas temporal
    filtered = applyDateRangeFilter(filtered)

    setFilteredEntregas(filtered)
    actualizarContadores(filtered)

    // Calcular paginación
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    setTotalPages(totalPages)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedEntregas(filtered.slice(startIndex, endIndex))
  }, [entregas, searchQuery, activeTab, currentPage, itemsPerPage, dateRange.from?.getTime(), dateRange.to?.getTime()])

  useEffect(() => {
    const totalItems = filteredEntregas.length
    const newTotalPages = Math.ceil(totalItems / itemsPerPage) || 1
    setTotalPages(newTotalPages)
    const newCurrentPage = Math.min(currentPage, newTotalPages)
    setCurrentPage(newCurrentPage)
    const startIndex = (newCurrentPage - 1) * itemsPerPage
    const currentItems = filteredEntregas.slice(startIndex, startIndex + itemsPerPage)
    setPaginatedEntregas(currentItems)
  }, [filteredEntregas, currentPage, itemsPerPage])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Gestión de Entregas</CardTitle>
        <CardDescription>Seguimiento y control de entregas de vehículos</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EntregaTab)} className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar..."
                      className="pl-8 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
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

                  <PrintExportButton
                    entregas={filteredEntregas}
                    activeTab={activeTab}
                    searchQuery={searchQuery}
                    dateFilter={dateRange}
                  />

                  {/* Botón de filtro de fechas temporal */}
                  <DateFilter
                    onDateFilterChange={(from, to) => setDateRange({ from, to })}
                    dateFilter={dateRange}
                    title="Filtrar por fecha de entrega"
                    description="Selecciona un rango de fechas para filtrar por fecha de entrega"
                  />
                </div>
                <TabsList className="h-9 bg-muted/50">
                  <TabsTrigger value="todas" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                    <span>Todas</span>
                    <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                      {counts.todas}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pendientes" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                    <span>Pendientes</span>
                    <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                      {counts.pendientes}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="docu_no_entregada" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                    <span>Docu. No entregada</span>
                    <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                      {counts.docu_no_entregada}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="con_incidencia" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                    <span>Con incidencia</span>
                    <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                      {counts.con_incidencia}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="sin_incidencia" className="px-3 py-1 h-7 data-[state=active]:bg-background">
                    <span>Sin incidencia</span>
                    <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                      {counts.sin_incidencia}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value={activeTab} className="mt-0">
                <div className="rounded-lg border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-b border-border">
                        <TableHead className="w-20 truncate py-2">FECHA VENTA</TableHead>
                        <TableHead className="w-20 truncate py-2">FECHA ENTREGA</TableHead>
                        <TableHead className="w-20 truncate py-2">MATRÍCULA</TableHead>
                        <TableHead className="w-24 truncate py-2">MODELO</TableHead>
                        <TableHead className="w-24 truncate py-2">ASESOR</TableHead>
                        <TableHead className="w-16 truncate py-2">OR</TableHead>
                        <TableHead className="w-32 truncate py-2">INCIDENCIAS</TableHead>
                        <TableHead className="w-40 truncate py-2">OBSERVACIONES</TableHead>
                        <TableHead className="w-24 truncate py-2">ACCIONES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading || authLoading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="flex justify-center items-center">
                              <Loader2 className="h-6 w-6 animate-spin mr-2" />
                              <span>Cargando entregas...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedEntregas.map((entrega, index) => (
                          <TableRow
                            key={entrega.id}
                            className={cn(
                              "h-8 hover:bg-muted/30",
                              index % 2 === 0 ? "bg-black/5 dark:bg-black/20" : "",
                            )}
                          >
                            <TableCell className="py-1">
                              <div className="flex items-center">
                                <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                {formatDateDisplay(entrega.fecha_venta)}
                              </div>
                            </TableCell>
                            <TableCell
                              className="py-1 cursor-pointer"
                              onClick={() => handleCellClick(entrega, "fecha_entrega")}
                            >
                              {editingCell?.id === entrega.id && editingCell?.field === "fecha_entrega" ? (
                                <Input
                                  ref={inputRef}
                                  type="text"
                                  value={editValue}
                                  onChange={handleInputChange}
                                  onKeyDown={handleInputKeyDown}
                                  onBlur={handleInputBlur}
                                  className="h-7 text-xs p-1 w-full"
                                  placeholder="DD/MM/AAAA"
                                />
                              ) : (
                                <div className="flex items-center">
                                  <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  {formatDateDisplay(entrega.fecha_entrega)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium py-1">
                              <span className="truncate block">{entrega.matricula}</span>
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="truncate max-w-[90px]">{entrega.modelo}</div>
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="truncate max-w-[90px]">{entrega.asesor}</div>
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="truncate max-w-[90px]">{entrega.or}</div>
                            </TableCell>
                            <TableCell className="py-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "h-7 w-[160px] text-xs flex items-center justify-center gap-1",
                                      entrega.tipos_incidencia && entrega.tipos_incidencia.length > 0
                                        ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300"
                                        : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300",
                                    )}
                                  >
                                    {entrega.tipos_incidencia && entrega.tipos_incidencia.length > 0 ? (
                                      <>
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>
                                          {entrega.tipos_incidencia.length === 1
                                            ? entrega.tipos_incidencia[0]
                                            : `${entrega.tipos_incidencia.length} incidencias`}
                                        </span>
                                      </>
                                    ) : (
                                      <span>Sin incidencias</span>
                                    )}
                                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[200px]">
                                  <DropdownMenuLabel>Tipos de incidencia</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {TIPOS_INCIDENCIA.map((tipo) => (
                                    <DropdownMenuCheckboxItem
                                      key={tipo}
                                      checked={entrega.tipos_incidencia?.includes(tipo) || false}
                                      onCheckedChange={() => toggleTipoIncidencia(entrega.id, tipo)}
                                    >
                                      {tipo === "Carrocería" && <Car className="h-3.5 w-3.5 mr-2" />}
                                      {tipo === "Mecánica" && <Wrench className="h-3.5 w-3.5 mr-2" />}
                                      {tipo === "Limpieza" && <Sparkles className="h-3.5 w-3.5 mr-2" />}
                                      {tipo === "2ª llave" && <Key className="h-3.5 w-3.5 mr-2" />}
                                      {tipo === "CardKey" && <CreditCard className="h-3.5 w-3.5 mr-2" />}
                                      {tipo === "Ficha técnica" && <FileText className="h-3.5 w-3.5 mr-2" />}
                                      {tipo === "Permiso circulación" && <FileCheck className="h-3.5 w-3.5 mr-2" />}
                                      {tipo}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                            <TableCell
                              className="py-1 cursor-pointer"
                              onClick={() => handleCellClick(entrega, "observaciones")}
                            >
                              {editingCell?.id === entrega.id && editingCell?.field === "observaciones" ? (
                                <Input
                                  ref={inputRef}
                                  type="text"
                                  value={editValue}
                                  onChange={handleInputChange}
                                  onKeyDown={handleInputKeyDown}
                                  onBlur={handleInputBlur}
                                  className="h-7 text-xs p-1 w-full"
                                  placeholder="Añadir observaciones..."
                                />
                              ) : (
                                <div className="truncate max-w-[150px] text-muted-foreground">
                                  {entrega.observaciones || (
                                    <span className="italic opacity-60">Haz clic para añadir observaciones...</span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="flex items-center space-x-1">
                                <Link href={`/dashboard/entregas/${entrega.id}`} passHref>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalles">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>

                                {/* Botón de Incentivos: ahora llama a handleTrophyClick */}
                                <Button
                                  variant={entrega.enviado_a_incentivos ? "ghost" : "outline"}
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8",
                                    entrega.enviado_a_incentivos
                                      ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                      : "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50",
                                  )}
                                  title={
                                    !entrega.fecha_entrega 
                                      ? "Se requiere fecha de entrega para enviar a incentivos"
                                      : entrega.enviado_a_incentivos 
                                        ? "Reenviar a incentivos" 
                                        : "Enviar a incentivos"
                                  }
                                  onClick={(e) => {
                                    console.log("🎯 Botón trofeo clickeado para entrega:", entrega.id)
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleTrophyClick(entrega)
                                  }}
                                  disabled={enviandoIncentivo === entrega.id || !entrega.fecha_entrega} // Deshabilitado mientras se envía o si no hay fecha de entrega
                                >
                                  {enviandoIncentivo === entrega.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trophy className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8",
                                    entrega.email_enviado
                                      ? "text-green-600 hover:text-green-700 hover:bg-green-50 cursor-not-allowed"
                                      : "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
                                  )}
                                  title={entrega.email_enviado ? "Email ya enviado" : "Enviar notificación de entrega"}
                                  onClick={() => handleEnviarEmail(entrega)}
                                  disabled={
                                    enviandoEmail === entrega.id || entrega.email_enviado || !entrega.fecha_entrega
                                  } // El email SÍ requiere fecha de entrega
                                >
                                  {enviandoEmail === entrega.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className={cn("h-4 w-4", entrega.email_enviado && "text-green-600")} />
                                  )}
                                </Button>

                                {/* Botón de Solicitar Recogida */}
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  title="Solicitar recogida de documentación"
                                  onClick={() => handleSolicitarRecogida(entrega)}
                                >
                                  <Truck className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Paginación */}
                <div className="mt-2 rounded-lg border bg-card shadow-sm">
                  <ReusablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={paginatedEntregas.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(value) => {
                      setItemsPerPage(value)
                      setCurrentPage(1)
                    }}
                    itemsPerPageOptions={[10, 20, 30, 50]}
                    showItemsPerPage={true}
                    showFirstLastButtons={true}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
