"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, Calendar, Phone, MessageSquare, Package, Loader2, Truck, Hand, FileText, Car, UserCircle, FileCheck, Key, CreditCard, Leaf, Send, TestTube } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"
import { Label } from "@/components/ui/label"

interface VehiculoParaRecoger {
  id: string
  fecha_entrega: string
  matricula: string
  modelo: string
  asesor: string
  or: string
  client_name?: string
  client_phone?: string
  client_email?: string
  client_address?: string
  client_postal_code?: string
  client_city?: string
  client_province?: string
  brand?: string
}

interface VehiculosParaRecogerProps {
  onSolicitarRecogida: (matricula: string) => void
}

export function VehiculosParaRecoger({ onSolicitarRecogida }: VehiculosParaRecogerProps) {
  const [vehiculos, setVehiculos] = useState<VehiculoParaRecoger[]>([])
  const [filteredVehiculos, setFilteredVehiculos] = useState<VehiculoParaRecoger[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateFilter, setDateFilter] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null })
  const [selectedMatricula, setSelectedMatricula] = useState<string | null>(null)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [showRecogidaModal, setShowRecogidaModal] = useState(false)
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoParaRecoger | null>(null)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [otrosMaterial, setOtrosMaterial] = useState("")
  const [showOtrosInput, setShowOtrosInput] = useState(false)
  const [recogidasAñadidas, setRecogidasAñadidas] = useState<any[]>([])
  const [enviandoRecogidas, setEnviandoRecogidas] = useState(false)

  // Estados para entrega en mano
  const [showEntregaEnManoModal, setShowEntregaEnManoModal] = useState(false)
  const [vehiculoEntregaEnMano, setVehiculoEntregaEnMano] = useState<VehiculoParaRecoger | null>(null)
  const [emailEntregaEnMano, setEmailEntregaEnMano] = useState("")
  const [materialesEntregaEnMano, setMaterialesEntregaEnMano] = useState<string[]>([])
  const [enviandoConfirmacion, setEnviandoConfirmacion] = useState(false)

  // Estados para datos de quien recoge
  const [nombreRecoge, setNombreRecoge] = useState("")
  const [dniRecoge, setDniRecoge] = useState("")
  const [emailRecoge, setEmailRecoge] = useState("")

  const supabase = createClientComponentClient()
  const { user, profile } = useAuth()

  // Filtros rápidos para fechas
  const quickFilters = [
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
    { label: "Último año", days: 365 },
  ]

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // Cargar vehículos con fecha de entrega
  const loadVehiculos = async () => {
    if (initialLoad) {
      setInitialLoad(false)
    }
    setLoading(true)
    try {
      // Verificar si el usuario es admin, supervisor o director
      const isAdmin = profile?.role === "admin" || profile?.role === "supervisor" || profile?.role === "director"
      
      // Obtener matrículas que ya tienen recogidas solicitadas
      const { data: recogidasExistentes, error: recogidasError } = await supabase
        .from("recogidas_historial")
        .select("matricula")
        .in("estado", ["solicitada", "en_transito", "entregada"])
      
      const matriculasConRecogida = recogidasExistentes?.map(r => r.matricula) || []
      
      if (recogidasError) {
        console.error("Error al cargar recogidas existentes:", recogidasError)
        // Continuar sin filtrar recogidas existentes
      }
      
      // Obtener matrículas que ya tienen entregas en mano
      const { data: entregasEnMano, error: entregasEnManoError } = await supabase
        .from("entregas_en_mano")
        .select("matricula")
        .in("estado", ["solicitada", "confirmada"])
      
      const matriculasConEntregaEnMano = entregasEnMano?.map(e => e.matricula) || []
      
      if (entregasEnManoError) {
        console.error("Error al cargar entregas en mano:", entregasEnManoError)
        // Continuar sin filtrar entregas en mano
      }
      
      // Combinar todas las matrículas que ya tienen algún tipo de recogida
      const matriculasExcluidas = [...new Set([...matriculasConRecogida, ...matriculasConEntregaEnMano])]
      
      // Primero obtener las entregas
      let entregasQuery = supabase
        .from("entregas")
        .select(`
          id,
          fecha_entrega,
          matricula,
          modelo,
          asesor,
          or
        `)
        .not("fecha_entrega", "is", null)
        .order("fecha_entrega", { ascending: false })

      // Si no es admin, filtrar por asesor
      if (!isAdmin && profile?.alias) {
        entregasQuery = entregasQuery.ilike("asesor", `%${profile.alias}%`)
      }

      const { data: entregasData, error: entregasError } = await entregasQuery

      if (entregasError) {
        console.error("Error al cargar entregas:", entregasError)
        toast.error(`Error al cargar los vehículos: ${entregasError.message}`)
        return
      }

      if (!entregasData || entregasData.length === 0) {
        setVehiculos([])
        setFilteredVehiculos([])
        toast.info("No hay vehículos con fecha de entrega")
        return
      }

      // Obtener todas las matrículas únicas
      const matriculas = [...new Set(entregasData.map(e => e.matricula))]

      // Obtener datos de sales_vehicles en una sola consulta
      const { data: salesData, error: salesError } = await supabase
        .from("sales_vehicles")
        .select("license_plate, client_name, client_phone, client_email, client_address, client_postal_code, client_city, client_province, brand")
        .in("license_plate", matriculas)

      if (salesError) {
        console.error("Error al cargar datos de clientes:", salesError)
        toast.warning("Algunos datos del cliente podrían no estar disponibles")
        // Continuar sin datos de cliente
      }

      // Crear un mapa para acceso rápido
      const salesMap = new Map()
      if (salesData) {
        salesData.forEach(sale => {
          salesMap.set(sale.license_plate, sale)
        })
      }

      // Combinar los datos
      const vehiculosConCliente = entregasData.map(vehiculo => {
        const salesInfo = salesMap.get(vehiculo.matricula)
        return {
          ...vehiculo,
          // Usar datos de sales_vehicles
          client_name: salesInfo?.client_name || "",
          client_phone: salesInfo?.client_phone || "",
          client_email: salesInfo?.client_email || "",
          client_address: salesInfo?.client_address || "",
          client_postal_code: salesInfo?.client_postal_code || "",
          client_city: salesInfo?.client_city || "",
          client_province: salesInfo?.client_province || "",
          brand: salesInfo?.brand || "",
        }
      })

      // Filtrar vehículos que ya tienen recogidas o entregas en mano
      const vehiculosDisponibles = vehiculosConCliente.filter(vehiculo => 
        !matriculasExcluidas.includes(vehiculo.matricula)
      )

      setVehiculos(vehiculosDisponibles)
      setFilteredVehiculos(vehiculosDisponibles)
      toast.success(`${vehiculosDisponibles.length} vehículos disponibles para recogida`)
    } catch (err) {
      console.error("Error inesperado:", err)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  const applyFilters = useMemo(() => {
    if (vehiculos.length === 0) return []

    let filtered = vehiculos

    // Filtro de búsqueda
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (vehiculo) =>
          vehiculo.matricula?.toLowerCase().includes(query) ||
          vehiculo.modelo?.toLowerCase().includes(query) ||
          vehiculo.asesor?.toLowerCase().includes(query) ||
          vehiculo.client_name?.toLowerCase().includes(query) ||
          vehiculo.client_phone?.toLowerCase().includes(query) ||
          vehiculo.brand?.toLowerCase().includes(query)
      )
    }

    // Filtro de fechas
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((vehiculo) => {
        const fechaEntrega = new Date(vehiculo.fecha_entrega)
        
        if (dateFilter.startDate && fechaEntrega < dateFilter.startDate) {
          return false
        }
        
        if (dateFilter.endDate && fechaEntrega > dateFilter.endDate) {
          return false
        }
        
        return true
      })
    }

    // Filtrar vehículos que están en la lista de recogidas pendientes
    const matriculasEnRecogidasPendientes = recogidasAñadidas.map(r => r.matricula)
    filtered = filtered.filter(vehiculo => 
      !matriculasEnRecogidasPendientes.includes(vehiculo.matricula)
    )

    return filtered
  }, [vehiculos, searchQuery, dateFilter, recogidasAñadidas])

  // Calcular paginación
  const paginatedVehiculos = useMemo(() => {
    if (applyFilters.length === 0) return []
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return applyFilters.slice(startIndex, endIndex)
  }, [applyFilters, currentPage, itemsPerPage])

  // Actualizar total de páginas
  useEffect(() => {
    setTotalPages(Math.ceil(applyFilters.length / itemsPerPage))
    setCurrentPage(1)
  }, [applyFilters, itemsPerPage])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadVehiculos()
  }, [])

  // Verificar estructura de tablas al cargar
  useEffect(() => {
    const verificarEstructura = async () => {
      try {
        const response = await fetch("/api/check-table-structure")
        if (response.ok) {
          const data = await response.json()
          console.log("Estado de las tablas:", data)
          
          if (!data.recogidas_historial.exists) {
            toast.error("Tabla de recogidas no disponible. Contacta al administrador.")
          }
          
          if (!data.recogidas_email_config.exists) {
            console.warn("Tabla de configuración de email no existe")
          }
        }
      } catch (error) {
        console.error("Error verificando estructura:", error)
      }
    }

    verificarEstructura()
  }, [])

  // Focus en el buscador cuando se carga la página
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Función para abrir WhatsApp
  const openWhatsApp = (phone: string, vehiculo?: any) => {
    let message = "Hola! ya dispongo de su documentación original impresa por la DGT, ¿Donde la desea recibir? Se envia físicamente por empresa de paquetería. Gracias"
    
    // Si tenemos información del vehículo, personalizar el mensaje
    if (vehiculo) {
      message = `Hola! Ya dispongo de la documentación original impresa por la DGT de su vehículo ${vehiculo.matricula} ${vehiculo.brand || ''} ${vehiculo.modelo || ''}. ¿Dónde desea recibirla? Se envía físicamente por empresa de paquetería. Gracias`
    }
    
    console.log('Mensaje WhatsApp:', message) // Debug del mensaje
    const encodedMessage = encodeURIComponent(message)
    
    // Limpiar el número de teléfono y asegurar formato internacional
    let cleanPhone = phone.replace(/\D/g, '') // Remover todo excepto números
    
    // Si empieza con 0, removerlo
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1)
    }
    
    // Si no empieza con 34 (España), añadirlo
    if (!cleanPhone.startsWith('34')) {
      cleanPhone = '34' + cleanPhone
    }
    
    // Usar la URL de WhatsApp Web que funciona mejor
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedMessage}&type=phone_number&app_absent=0`
    console.log('WhatsApp URL:', whatsappUrl) // Para debug
    window.open(whatsappUrl, '_blank')
  }

  // Función para manejar clic en fila
  const handleRowClick = (vehiculoId: string, event: React.MouseEvent) => {
    // No deseleccionar si se hace clic en elementos interactivos
    const target = event.target as Element
    if (target.closest('button') || 
        target.closest('input') || 
        target.closest('[role="combobox"]') || 
        target.closest('span[onClick]') ||
        target.closest('a') ||
        target.closest('[data-interactive]')) {
      return
    }
    
    setSelectedRowId(selectedRowId === vehiculoId ? null : vehiculoId)
  }

  // Función para solicitar recogida
  const handleSolicitarRecogida = (matricula: string) => {
    const vehiculo = vehiculos.find(v => v.matricula === matricula)
    if (vehiculo) {
      setSelectedVehiculo(vehiculo)
      setSelectedMaterials([])
      setOtrosMaterial("")
      setShowOtrosInput(false)
      setShowRecogidaModal(true)
    }
  }

  const handleEntregaEnMano = async (matricula: string) => {
    const vehiculo = vehiculos.find(v => v.matricula === matricula)
    if (vehiculo) {
      setVehiculoEntregaEnMano(vehiculo)
      setEmailEntregaEnMano(vehiculo.client_email || "")
      setNombreRecoge(vehiculo.client_name || "")
      setEmailRecoge(vehiculo.client_email || "")
      setMaterialesEntregaEnMano([])
      
      // Buscar DNI en sales_vehicles
      try {
        const { data: salesData, error: salesError } = await supabase
          .from("sales_vehicles")
          .select("client_dni")
          .eq("license_plate", matricula)
          .single()
        
        if (!salesError && salesData?.client_dni) {
          setDniRecoge(salesData.client_dni)
        } else {
          setDniRecoge("")
        }
      } catch (error) {
        console.error("Error cargando DNI:", error)
        setDniRecoge("")
      }
      
      setShowEntregaEnManoModal(true)
    }
  }

  const toggleMaterial = (materialName: string) => {
    if (materialName === "Otros") {
      setShowOtrosInput(true)
      if (!selectedMaterials.includes("Otros")) {
        setSelectedMaterials(prev => [...prev, "Otros"])
      }
    } else {
      setSelectedMaterials(prev => 
        prev.includes(materialName) 
          ? prev.filter(m => m !== materialName)
          : [...prev, materialName]
      )
    }
  }

  const removeMaterial = (materialName: string) => {
    setSelectedMaterials(prev => prev.filter(m => m !== materialName))
    if (materialName === "Otros") {
      setShowOtrosInput(false)
      setOtrosMaterial("")
    }
  }

  const addOtrosMaterial = () => {
    if (otrosMaterial.trim()) {
      setSelectedMaterials(prev => [...prev, otrosMaterial.trim()])
      setOtrosMaterial("")
      setShowOtrosInput(false)
    }
  }

  // Funciones para entrega en mano
  const toggleMaterialEntregaEnMano = (materialName: string) => {
    if (materialName === "Otros") {
      setShowOtrosInput(true)
      if (!materialesEntregaEnMano.includes("Otros")) {
        setMaterialesEntregaEnMano(prev => [...prev, "Otros"])
      }
    } else {
      setMaterialesEntregaEnMano(prev => 
        prev.includes(materialName) 
          ? prev.filter(m => m !== materialName)
          : [...prev, materialName]
      )
    }
  }

  const addOtrosMaterialEntregaEnMano = () => {
    if (otrosMaterial.trim()) {
      setMaterialesEntregaEnMano(prev => [...prev, otrosMaterial.trim()])
      setOtrosMaterial("")
      setShowOtrosInput(false)
    }
  }

  const enviarConfirmacionEntrega = async () => {
    if (!vehiculoEntregaEnMano || !emailRecoge || !nombreRecoge || materialesEntregaEnMano.length === 0) {
      toast.error("Por favor completa todos los campos obligatorios")
      return
    }

    setEnviandoConfirmacion(true)
    try {
      const response = await fetch("/api/recogidas/send-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricula: vehiculoEntregaEnMano.matricula,
          email: emailRecoge,
          materiales: materialesEntregaEnMano,
          nombre_cliente: vehiculoEntregaEnMano.client_name,
          nombre_recoge: nombreRecoge,
          dni_recoge: dniRecoge,
          email_recoge: emailRecoge,
          usuario_solicitante: profile?.full_name || user?.email || "Usuario"
        }),
      })

      if (!response.ok) {
        throw new Error("Error enviando confirmación")
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success("Confirmación enviada correctamente")
        setShowEntregaEnManoModal(false)
        // Recargar vehículos para actualizar el estado
        loadVehiculos()
        // Cambiar a la pestaña de historial
        onSolicitarRecogida("") // Esto activará la pestaña de historial
      } else {
        toast.error("Error al enviar la confirmación")
      }
    } catch (error) {
      console.error("Error enviando confirmación:", error)
      toast.error("Error al enviar la confirmación")
    } finally {
      setEnviandoConfirmacion(false)
    }
  }

  const añadirRecogida = (datosRecogida: any) => {
    try {
      console.log("=== AÑADIENDO RECOGIDA A LA LISTA ===")
      
      // Verificar que tenemos los datos mínimos necesarios
      if (!datosRecogida) {
        throw new Error("Datos de recogida no proporcionados")
      }
      
      if (!datosRecogida.matricula) {
        throw new Error("Datos de recogida incompletos: falta matrícula")
      }
      
      // Logs seguros para debugging
      try {
        console.log("Datos a añadir:", JSON.stringify(datosRecogida, null, 2))
      } catch (jsonError) {
        console.log("Datos a añadir (no serializable):", datosRecogida)
      }
      
      console.log("Usuario actual - ID:", user?.id || "null")
      console.log("Usuario actual - Email:", user?.email || "null")
      console.log("Perfil actual - Nombre:", profile?.full_name || "null")
      console.log("Perfil actual - Rol:", profile?.role || "null")
      
      // Crear objeto de recogida para la lista con validación defensiva
      const nuevaRecogida = {
        id: `temp_${Date.now()}_${Math.random()}`, // ID temporal
        matricula: String(datosRecogida.matricula || ""),
        mensajeria: String(datosRecogida.mensajeria || 'MRW'),
        centro_recogida: String(datosRecogida.centro_recogida || 'Terrassa'),
        materiales: Array.isArray(datosRecogida.materiales) ? datosRecogida.materiales : [],
        nombre_cliente: String(datosRecogida.nombre_cliente || ''),
        direccion_cliente: String(datosRecogida.direccion_cliente || ''),
        codigo_postal: String(datosRecogida.codigo_postal || ''),
        ciudad: String(datosRecogida.ciudad || ''),
        provincia: String(datosRecogida.provincia || ''),
        telefono: String(datosRecogida.telefono || ''),
        email: String(datosRecogida.email || ''),
        observaciones_envio: String(datosRecogida.observaciones_envio || ''),
        usuario_solicitante: String(profile?.full_name || user?.email || "Usuario"),
        usuario_solicitante_id: user?.id || null,
        estado: "pendiente"
      }
      
      console.log("Nueva recogida creada exitosamente")
      
      // Añadir a la lista de recogidas pendientes de forma segura
      setRecogidasAñadidas(prev => {
        try {
          const nuevaLista = Array.isArray(prev) ? [...prev, nuevaRecogida] : [nuevaRecogida]
          console.log("Lista actualizada:", nuevaLista.length, "recogidas")
          return nuevaLista
        } catch (setError) {
          console.error("Error al actualizar lista:", setError)
          return [nuevaRecogida] // Fallback a lista con solo la nueva recogida
        }
      })
      
      console.log("=== RECOGIDA AÑADIDA A LA LISTA ===")
      
      // Mostrar toast de éxito
      try {
        toast.success("Recogida añadida a la lista de envío")
      } catch (toastError) {
        console.error("Error al mostrar toast:", toastError)
      }
      
      // Cerrar el modal de forma segura
      try {
        setShowRecogidaModal(false)
      } catch (modalError) {
        console.error("Error al cerrar modal:", modalError)
      }
      
      return nuevaRecogida
    } catch (error) {
      console.error("=== ERROR AL AÑADIR RECOGIDA ===")
      console.error("Error completo:", error)
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available")
      
      // Mostrar toast de error de forma segura
      try {
        toast.error("Error al añadir la recogida")
      } catch (toastError) {
        console.error("Error al mostrar toast de error:", toastError)
      }
      
      return null
    }
  }

  const guardarRecogida = async (datosRecogida: any) => {
    try {
      console.log("=== INICIANDO GUARDADO DE RECOGIDA ===")
      console.log("Datos a guardar:", JSON.stringify(datosRecogida, null, 2))
      console.log("Usuario actual:", user?.id, user?.email)
      console.log("Perfil actual:", profile?.full_name, profile?.role)
      
      // Verificar que tenemos los datos mínimos necesarios
      if (!datosRecogida || !datosRecogida.matricula) {
        throw new Error("Datos de recogida incompletos: falta matrícula")
      }
      
      // Preparar datos para inserción (versión simplificada)
      const datosInsertar = {
        matricula: datosRecogida.matricula,
        mensajeria: datosRecogida.mensajeria || 'MRW',
        centro_recogida: datosRecogida.centro_recogida || 'Terrassa',
        materiales: Array.isArray(datosRecogida.materiales) ? datosRecogida.materiales : [],
        nombre_cliente: datosRecogida.nombre_cliente || '',
        direccion_cliente: datosRecogida.direccion_cliente || '',
        codigo_postal: datosRecogida.codigo_postal || '',
        ciudad: datosRecogida.ciudad || '',
        provincia: datosRecogida.provincia || '',
        telefono: datosRecogida.telefono || '',
        email: datosRecogida.email || '',
        observaciones_envio: datosRecogida.observaciones_envio || '',
        usuario_solicitante: profile?.full_name || user?.email || "Usuario",
        usuario_solicitante_id: user?.id || null,
        estado: "solicitada"
      }
      
      console.log("Datos preparados para inserción:", JSON.stringify(datosInsertar, null, 2))
      
      // Inserción directa sin verificación previa
      const { data, error } = await supabase
        .from("recogidas_historial")
        .insert([datosInsertar])
        .select()
        .single()

      if (error) {
        console.error("=== ERROR DETALLADO AL GUARDAR ===")
        console.error("Código de error:", error.code)
        console.error("Mensaje:", error.message)
        console.error("Detalles:", error.details)
        console.error("Hint:", error.hint)
        toast.error(`Error al guardar la recogida: ${error.message}`)
        return null
      }

      console.log("=== RECOGIDA GUARDADA EXITOSAMENTE ===")
      console.log("ID generado:", data.id)
      console.log("Datos guardados:", data)
      return data
    } catch (error) {
      console.error("=== ERROR INESPERADO ===")
      console.error("Tipo de error:", typeof error)
      console.error("Error completo:", error)
      toast.error("Error al guardar la recogida")
      return null
    }
  }

  const enviarRecogidasMasivo = async () => {
    if (recogidasAñadidas.length === 0) {
      toast.warning("No hay recogidas para enviar")
      return
    }

    setEnviandoRecogidas(true)
    try {
      console.log("=== INICIANDO ENVÍO MASIVO DE RECOGIDAS ===")
      console.log("Recogidas a procesar:", recogidasAñadidas.length)
      
      // Primero guardar todas las recogidas en la base de datos
      const recogidasGuardadas = []
      for (const recogida of recogidasAñadidas) {
        console.log("Guardando recogida:", recogida.matricula)
        const resultado = await guardarRecogida(recogida)
        if (resultado) {
          recogidasGuardadas.push(resultado)
        } else {
          toast.error(`Error al guardar recogida ${recogida.matricula}`)
          setEnviandoRecogidas(false)
          return
        }
      }
      
      console.log("Recogidas guardadas:", recogidasGuardadas.length)
      
      // Ahora enviar los emails con los IDs reales de la base de datos
      const recogidaIds = recogidasGuardadas.map(r => r.id)
      
      const response = await fetch("/api/recogidas/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recogidaIds: recogidaIds
        }),
      })

      if (!response.ok) {
        throw new Error("Error enviando emails")
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success(`${recogidasGuardadas.length} recogidas enviadas correctamente`)
        setRecogidasAñadidas([])
        // Recargar la lista de vehículos para ocultar los que ya se procesaron
        await loadVehiculos()
        // Navegar al historial
        onSolicitarRecogida("") // Esto activará la pestaña de historial
      } else {
        toast.error("Error al enviar las recogidas")
      }
    } catch (error) {
      console.error("Error enviando recogidas:", error)
      toast.error("Error al enviar las recogidas")
    } finally {
      setEnviandoRecogidas(false)
    }
  }

  const verificarTablaRecogidas = async () => {
    try {
      const { data, error } = await supabase
        .from("recogidas_historial")
        .select("id")
        .limit(1)

      if (error) {
        console.error("Error verificando tabla recogidas_historial:", error)
        toast.error(`Tabla no existe o error de acceso: ${error.message}`)
        return false
      }

      console.log("Tabla recogidas_historial existe y es accesible")
      return true
    } catch (error) {
      console.error("Error inesperado verificando tabla:", error)
      return false
    }
  }

  const probarInsercion = async () => {
    try {
      console.log("=== PROBANDO INSERCIÓN MÍNIMA ===")
      
      const datosPrueba = {
        matricula: "TEST123",
        mensajeria: "MRW",
        centro_recogida: "Terrassa",
        materiales: ["llaves"],
        usuario_solicitante: "Usuario Test",
        estado: "solicitada"
      }
      
      console.log("Datos de prueba:", datosPrueba)
      
      const { data, error } = await supabase
        .from("recogidas_historial")
        .insert([datosPrueba])
        .select()
        .single()

      if (error) {
        console.error("Error en inserción de prueba:", error)
        toast.error(`Error de prueba: ${error.message}`)
        return false
      }

      console.log("Inserción de prueba exitosa:", data)
      toast.success("Inserción de prueba exitosa")
      
      // Limpiar el registro de prueba
      await supabase
        .from("recogidas_historial")
        .delete()
        .eq("id", data.id)
      
      return true
    } catch (error) {
      console.error("Error inesperado en prueba:", error)
      return false
    }
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  // Función para limpiar filtro de fechas
  const clearDateFilter = () => {
    setDateFilter({ startDate: null, endDate: null })
  }

  // Función para obtener números de página (igual que en sales-table)
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

  return (
    <div className="space-y-4">
      {/* Card principal con título y buscador */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Gestión de Recogidas
          </CardTitle>
          <CardDescription>
            Solicitar recogida de documentación y material por mensajería
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Subcard del buscador - estilo gestión de ventas */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <Card className="p-3">
                <div className="flex items-center gap-2 relative">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Buscar por matrícula, modelo, cliente..."
                    className="w-80"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </Card>
              <Button
                variant="outline"
                size="icon"
                onClick={loadVehiculos}
                disabled={initialLoad || loading}
                className="h-9 w-9"
                title="Actualizar"
              >
                {initialLoad || loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant={dateFilter.startDate || dateFilter.endDate ? "outline" : "outline"}
                size="icon"
                onClick={() => setShowDateFilter(true)}
                className={dateFilter.startDate || dateFilter.endDate
                  ? "h-9 w-9 border border-blue-500 text-blue-300 bg-transparent shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
                  : "h-9 w-9"}
                title="Filtrar por fecha"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {applyFilters.length} vehículos
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <div className="flex gap-4">
        {/* Tabla - 70% */}
        <div className="w-[70%]">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3">FECHA DE ENTREGA</TableHead>
                    <TableHead className="py-3">MATRÍCULA</TableHead>
                    <TableHead className="py-3">MARCA</TableHead>
                    <TableHead className="py-3">MODELO</TableHead>
                    <TableHead className="py-3">CLIENTE</TableHead>
                    <TableHead className="py-3">TELÉFONO</TableHead>
                    <TableHead className="py-3">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialLoad ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Cargando vehículos...</span>
                          <span className="text-xs text-muted-foreground">Esto puede tomar unos segundos</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Actualizando...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedVehiculos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery || dateFilter.startDate || dateFilter.endDate 
                          ? "No se encontraron vehículos con los filtros aplicados"
                          : "No hay vehículos con fecha de entrega"
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVehiculos.map((vehiculo, index) => (
                      <TableRow 
                        key={vehiculo.id} 
                        className={cn(
                          "transition-all duration-300 ease-in-out cursor-pointer border-b relative",
                          index % 2 === 0 ? "bg-background" : "bg-muted/10",
                          selectedRowId === vehiculo.id 
                            ? "border-2 border-primary shadow-md bg-primary/5" 
                            : "hover:bg-muted/30",
                        )}
                        data-selected={selectedRowId === vehiculo.id}
                        onClick={(e) => handleRowClick(vehiculo.id, e)}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {formatDate(vehiculo.fecha_entrega)}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-sm">{vehiculo.matricula}</span>
                        </TableCell>
                        <TableCell className="py-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate max-w-[100px] text-sm cursor-help">{vehiculo.brand || "-"}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Marca: {vehiculo.brand || "No disponible"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate max-w-[120px] text-sm cursor-help">{vehiculo.modelo}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Modelo: {vehiculo.modelo}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate max-w-[120px] text-sm cursor-help">{vehiculo.client_name || "-"}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cliente: {vehiculo.client_name || "No disponible"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-3">
                          {vehiculo.client_phone ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                openWhatsApp(vehiculo.client_phone, vehiculo)
                              }}
                              data-interactive
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              {vehiculo.client_phone}
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2 relative">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSolicitarRecogida(vehiculo.matricula)
                                    }}
                                    className="h-8 w-8 text-blue-500 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                                    data-interactive
                                  >
                                    <Package className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Solicitar Recogida</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEntregaEnMano(vehiculo.matricula)
                                    }}
                                    className="h-8 w-8 text-green-500 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30"
                                    data-interactive
                                  >
                                    <Hand className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Entrega en Mano</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Indicador de selección - punto en la esquina superior derecha */}
                            {selectedRowId === vehiculo.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '0px',
                                  right: '0px',
                                  width: '8px',
                                  height: '8px',
                                  backgroundColor: 'hsl(var(--primary))',
                                  borderRadius: '50%',
                                  zIndex: 10,
                                }}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Card lateral - 30% */}
        <div className="w-[30%]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Recogidas Pendientes
              </CardTitle>
              <CardDescription>
                Recogidas añadidas para envío masivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recogidasAñadidas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay recogidas añadidas</p>
                  <p className="text-xs">Añade recogidas desde la tabla</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recogidasAñadidas.map((recogida, index) => (
                      <div key={recogida.id} className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-blue-600">{recogida.matricula}</span>
                              <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            </div>
                            {recogida.nombre_cliente && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {recogida.nombre_cliente}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setRecogidasAñadidas(prev => prev.filter(r => r.id !== recogida.id))}
                            className="text-red-500 hover:text-red-700 text-xs p-1 hover:bg-red-50 rounded"
                            title="Eliminar de la lista"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {recogida.materiales.map((material: string) => {
                            const materialConfig = [
                              { name: "Permiso circulación", icon: FileCheck, color: "text-blue-500" },
                              { name: "Ficha técnica", icon: FileText, color: "text-green-500" },
                              { name: "Pegatina Medioambiental", icon: Leaf, color: "text-emerald-500" },
                              { name: "COC", icon: FileText, color: "text-blue-600" },
                              { name: "2ª Llave", icon: Key, color: "text-orange-500" },
                              { name: "CardKey", icon: CreditCard, color: "text-indigo-500" }
                            ].find(m => m.name === material)
                            
                            return materialConfig ? (
                              <div key={material} className="flex items-center p-1 bg-white rounded border" title={material}>
                                <materialConfig.icon className={`h-3 w-3 ${materialConfig.color}`} />
                              </div>
                            ) : (
                              <div key={material} className="flex items-center p-1 bg-white rounded border" title={material}>
                                <Package className="h-3 w-3 text-gray-500" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="mb-2 text-xs text-muted-foreground">
                      Total: {recogidasAñadidas.length} recogida{recogidasAñadidas.length !== 1 ? 's' : ''}
                    </div>
                    <Button
                      onClick={enviarRecogidasMasivo}
                      disabled={recogidasAñadidas.length === 0 || enviandoRecogidas}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {enviandoRecogidas ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Recogidas
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Se guardarán en BD y se enviarán los emails
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Subcard paginador - igual que en sales-table */}
      {totalPages > 1 && (
        <div className="mt-2 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {applyFilters.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            -{Math.min(currentPage * itemsPerPage, applyFilters.length)} de <span className="font-bold">{applyFilters.length}</span> resultados
          </div>
          <div className="flex items-center gap-2">
            {/* Selector de filas por página a la izquierda */}
            <div className="flex items-center gap-1 mr-4">
              <span className="text-xs">Filas por página:</span>
              <Select value={itemsPerPage.toString()} onValueChange={v => setItemsPerPage(Number(v))}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Flechas y números de página */}
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8">{'<<'}</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">{'<'}</Button>
            {getPageNumbers().map((n) => (
              <Button key={n} variant={n === currentPage ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(n)} className="h-8 w-8 font-bold">{n}</Button>
            ))}
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8">{'>'}</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8">{'>>'}</Button>
          </div>
        </div>
      )}

      {/* Modal de filtro de fechas */}
      <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtro de Fechas</DialogTitle>
            <DialogDescription>Selecciona un rango de fechas para filtrar por fecha de entrega</DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <div className="font-semibold mb-2">Filtros rápidos</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {quickFilters.map((f) => (
                <Button
                  key={f.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const end = new Date()
                    const start = new Date()
                    start.setDate(end.getDate() - f.days + 1)
                    setDateFilter({ startDate: start, endDate: end })
                  }}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="font-semibold mb-2">Rango personalizado</div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Fecha inicio</label>
                <Input
                  type="date"
                  value={dateFilter.startDate ? dateFilter.startDate.toISOString().slice(0, 10) : ""}
                  onChange={e => setDateFilter(df => ({ ...df, startDate: e.target.value ? new Date(e.target.value) : null }))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Fecha fin</label>
                <Input
                  type="date"
                  value={dateFilter.endDate ? dateFilter.endDate.toISOString().slice(0, 10) : ""}
                  onChange={e => setDateFilter(df => ({ ...df, endDate: e.target.value ? new Date(e.target.value) : null }))}
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                Limpiar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDateFilter(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowDateFilter(false)}
                  disabled={!dateFilter.startDate && !dateFilter.endDate}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Recogida Compacto */}
      <Dialog open={showRecogidaModal} onOpenChange={setShowRecogidaModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Solicitar Recogida - {selectedVehiculo?.matricula}
            </DialogTitle>
            <DialogDescription>
              Complete los datos para solicitar la recogida de documentación
            </DialogDescription>
          </DialogHeader>

          {selectedVehiculo && (
            <div className="space-y-4">
              {/* Información básica */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Información Básica
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Matrícula</Label>
                    <p className="text-xs font-medium">{selectedVehiculo.matricula}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Mensajería</Label>
                    <Input
                      defaultValue="MRW"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Centro Recogida</Label>
                    <Input
                      defaultValue="Terrassa"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Materiales */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Materiales a Enviar *</Label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { name: "Permiso circulación", icon: FileCheck, color: "text-blue-500" },
                    { name: "Ficha técnica", icon: FileText, color: "text-green-500" },
                    { name: "Pegatina Medioambiental", icon: Leaf, color: "text-emerald-500" },
                    { name: "COC", icon: FileText, color: "text-blue-500" },
                    { name: "2ª Llave", icon: Key, color: "text-orange-500" },
                    { name: "CardKey", icon: CreditCard, color: "text-indigo-500" },
                    { name: "Otros", icon: Package, color: "text-gray-500" }
                  ].map((material) => (
                    <Button
                      key={material.name}
                      type="button"
                      variant={selectedMaterials.includes(material.name) ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs justify-start"
                      onClick={() => toggleMaterial(material.name)}
                    >
                      <material.icon className={`h-3 w-3 mr-1 ${material.color}`} />
                      {material.name}
                    </Button>
                  ))}
                </div>

                {/* Campo de texto para "Otros" */}
                {showOtrosInput && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Especificar otro material</Label>
                      <Input
                        value={otrosMaterial}
                        onChange={(e) => setOtrosMaterial(e.target.value)}
                        className="h-6 text-xs"
                        placeholder="Ej: Escobillas, Manual de usuario..."
                        onKeyDown={(e) => e.key === "Enter" && addOtrosMaterial()}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-6 text-xs"
                      onClick={addOtrosMaterial}
                      disabled={!otrosMaterial.trim()}
                    >
                      Añadir
                    </Button>
                  </div>
                )}

                {/* Materiales seleccionados */}
                {selectedMaterials.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedMaterials.map((material) => (
                      <Badge key={material} variant="secondary" className="text-xs gap-1">
                        {material}
                        <button
                          type="button"
                          onClick={() => removeMaterial(material)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Datos del cliente */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Datos del Cliente
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      defaultValue={selectedVehiculo.client_name || ""}
                      className="h-6 text-xs"
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      defaultValue={selectedVehiculo.client_phone || ""}
                      className="h-6 text-xs"
                      placeholder="677233678"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      defaultValue={selectedVehiculo.client_email || ""}
                      className="h-6 text-xs"
                      placeholder="cliente@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Dirección</Label>
                  <Input
                    defaultValue={selectedVehiculo.client_address || ""}
                    className="h-6 text-xs"
                    placeholder="C/Costa 6"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">CP</Label>
                    <Input
                      defaultValue={selectedVehiculo.client_postal_code || ""}
                      className="h-6 text-xs"
                      placeholder="08232"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Ciudad</Label>
                    <Input
                      defaultValue={selectedVehiculo.client_city || ""}
                      className="h-6 text-xs"
                      placeholder="Viladecavalls"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Provincia</Label>
                    <Input
                      defaultValue={selectedVehiculo.client_province || ""}
                      className="h-6 text-xs"
                      placeholder="Barcelona"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Observaciones</Label>
                  <Input
                    className="h-6 text-xs"
                    placeholder="Observaciones adicionales sobre el envío..."
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecogidaModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    // Recopilar datos del formulario
                    const formData = {
                      matricula: selectedVehiculo.matricula,
                      mensajeria: "MRW", // Por defecto
                      centro_recogida: "Terrassa", // Por defecto
                      materiales: selectedMaterials,
                      nombre_cliente: selectedVehiculo.client_name || "",
                      direccion_cliente: selectedVehiculo.client_address || "",
                      codigo_postal: selectedVehiculo.client_postal_code || "",
                      ciudad: selectedVehiculo.client_city || "",
                      provincia: selectedVehiculo.client_province || "",
                      telefono: selectedVehiculo.client_phone || "",
                      email: selectedVehiculo.client_email || "",
                      observaciones_envio: "" // Se obtendría del formulario
                    }

                    // Añadir a la lista de recogidas pendientes (NO guardar en BD aún)
                    const recogidaAñadida = añadirRecogida(formData)
                    
                    if (recogidaAñadida) {
                      // Limpiar estado del modal
                      setSelectedMaterials([])
                      setOtrosMaterial("")
                      setShowOtrosInput(false)
                    }
                  }}
                >
                  <Package className="h-3 w-3 mr-1" />
                  Añadir Recogida
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Entrega en Mano */}
      <Dialog open={showEntregaEnManoModal} onOpenChange={setShowEntregaEnManoModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hand className="h-5 w-5 text-blue-500" />
              Entrega en Mano
            </DialogTitle>
            <DialogDescription>
              Solicitar entrega en mano de documentación al cliente
            </DialogDescription>
          </DialogHeader>

          {vehiculoEntregaEnMano && (
            <div className="space-y-6">
              {/* Card con información del vehículo */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{vehiculoEntregaEnMano.matricula}</h3>
                    <p className="text-sm text-muted-foreground">{vehiculoEntregaEnMano.modelo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{vehiculoEntregaEnMano.client_name || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                  </div>
                </div>
              </div>

              {/* Datos de quien recoge */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium">La Recoge *</Label>
                    <Input
                      value={nombreRecoge}
                      onChange={(e) => setNombreRecoge(e.target.value)}
                      className="h-6 text-xs mt-1"
                      placeholder="Nombre de quien recoge"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">DNI</Label>
                    <Input
                      value={dniRecoge}
                      onChange={(e) => setDniRecoge(e.target.value)}
                      className="h-6 text-xs mt-1"
                      placeholder="DNI de quien recoge"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Email *</Label>
                  <Input
                    type="email"
                    value={emailRecoge}
                    onChange={(e) => setEmailRecoge(e.target.value)}
                    className="h-6 text-xs mt-1"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                {/* Materiales a entregar */}
                <div>
                  <Label className="text-xs font-medium">Materiales a Entregar *</Label>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {[
                      { name: "Permiso circulación", icon: FileCheck, color: "text-blue-500" },
                      { name: "Ficha técnica", icon: FileText, color: "text-green-500" },
                      { name: "Pegatina Medioambiental", icon: Leaf, color: "text-emerald-500" },
                      { name: "COC", icon: FileText, color: "text-blue-500" },
                      { name: "2ª Llave", icon: Key, color: "text-orange-500" },
                      { name: "CardKey", icon: CreditCard, color: "text-indigo-500" },
                      { name: "Otros", icon: Package, color: "text-gray-500" }
                    ].map((material) => (
                      <Button
                        key={material.name}
                        type="button"
                        variant={materialesEntregaEnMano.includes(material.name) ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs justify-start"
                        onClick={() => toggleMaterialEntregaEnMano(material.name)}
                      >
                        <material.icon className={`h-3 w-3 mr-1 ${material.color}`} />
                        {material.name}
                      </Button>
                    ))}
                  </div>

                  {/* Campo de texto para "Otros" */}
                  {showOtrosInput && (
                    <div className="flex gap-2 items-end mt-1">
                      <div className="flex-1">
                        <Label className="text-xs">Especificar otro material</Label>
                        <Input
                          value={otrosMaterial}
                          onChange={(e) => setOtrosMaterial(e.target.value)}
                          className="h-6 text-xs mt-1"
                          placeholder="Ej: Escobillas, Manual de usuario..."
                          onKeyDown={(e) => e.key === "Enter" && addOtrosMaterialEntregaEnMano()}
                        />
                      </div>
                      <Button
                        size="sm"
                        className="h-6 text-xs"
                        onClick={addOtrosMaterialEntregaEnMano}
                        disabled={!otrosMaterial.trim()}
                      >
                        Añadir
                      </Button>
                    </div>
                  )}

                  {/* Materiales seleccionados */}
                  {materialesEntregaEnMano.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {materialesEntregaEnMano.map((material) => (
                        <Badge key={material} variant="secondary" className="text-xs gap-1">
                          {material}
                          <button
                            type="button"
                            onClick={() => {
                              setMaterialesEntregaEnMano(prev => prev.filter(m => m !== material))
                              if (material === "Otros") {
                                setShowOtrosInput(false)
                                setOtrosMaterial("")
                              }
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEntregaEnManoModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={enviarConfirmacionEntrega}
                  disabled={!emailRecoge || !nombreRecoge || materialesEntregaEnMano.length === 0 || enviandoConfirmacion}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {enviandoConfirmacion ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Confirmación
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Función helper para cn (className)
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
} 