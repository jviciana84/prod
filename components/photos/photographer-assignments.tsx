"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { RefreshCw, Plus, Save, Trash2, AlertCircle, Info, Users, CheckCircle, Eye, EyeOff, Settings, ChevronDown, Lock, Unlock, Calendar, BarChart2, BarChart, Printer, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface Photographer {
  id: string
  user_id: string
  email?: string
  full_name?: string
  percentage: number
  is_active: boolean
  is_hidden?: boolean
  is_locked?: boolean
  avatar_url?: string
}

interface UserInfo {
  id: string
  email: string
  full_name?: string
  source: string
  avatar_url?: string
}

export default function PhotographerAssignments() {
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [allUsers, setAllUsers] = useState<UserInfo[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("photographers")
  const [totalPercentage, setTotalPercentage] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { user, profile } = useAuth()
  const [showHidden, setShowHidden] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)

  // Estados para estadísticas
  const [photographerStats, setPhotographerStats] = useState<any[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })

  // Para añadir fotógrafo manualmente
  const [newEmail, setNewEmail] = useState("")
  const [newManualUserId, setNewManualUserId] = useState("")

  // Cargar datos
  useEffect(() => {
    fetchData()
  }, [])

  // Cargar estadísticas automáticamente
  useEffect(() => {
    console.log("useEffect de estadísticas ejecutado")
    console.log("Photographers length:", photographers.length)
    console.log("Can edit:", canEdit())
    console.log("Is initial load:", isInitialLoad)
    
    if (photographers.length > 0 && !isLoadingStats) {
      console.log("Cargando estadísticas automáticamente...")
      // Añadir un pequeño delay para evitar problemas de concurrencia
      setTimeout(() => {
        loadRealStats(true) // true = modo solo lectura
      }, 100)
    }
  }, [photographers, isInitialLoad])



  // Función para cargar estadísticas reales
  const loadRealStats = async (readOnly = false) => {
    console.log("loadRealStats llamado con readOnly:", readOnly)
    console.log("canEdit():", canEdit())
    console.log("isLoadingStats:", isLoadingStats)
    
    // Evitar llamadas múltiples
    if (isLoadingStats) {
      console.log("Ya se está cargando, ignorando llamada")
      return
    }
    
    if (!canEdit() && !readOnly) {
      console.log("Acceso denegado - no puede editar y no es modo solo lectura")
      toast({
        title: "Acceso denegado",
        description: "No tienes privilegios para realizar esta acción.",
        variant: "destructive",
      })
      return
    }

    console.log("Procediendo con carga de estadísticas...")
    setIsLoadingStats(true)
    setIsInitialLoad(false)
    try {
      console.log("Iniciando carga de estadísticas...")

      // Construir filtro de fechas
      let dateFilterQuery: { gte?: string; lte?: string } = {}
      if (dateFilter.from || dateFilter.to) {
        if (dateFilter.from && dateFilter.to) {
          dateFilterQuery = {
            gte: dateFilter.from.toISOString(),
            lte: dateFilter.to.toISOString()
          }
        } else if (dateFilter.from) {
          dateFilterQuery = { gte: dateFilter.from.toISOString() }
        } else if (dateFilter.to) {
          dateFilterQuery = { lte: dateFilter.to.toISOString() }
        }
      } else {
        // Por defecto, últimos 30 días
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        dateFilterQuery = { gte: thirtyDaysAgo.toISOString() }
      }

      console.log("Filtro de fechas:", dateFilterQuery)

      // Obtener fotos completadas por fotógrafo con filtro temporal
      let completedPhotosQuery = supabase
        .from("fotos")
        .select("assigned_to, photos_completed_date")
        .eq("photos_completed", true)

      // Aplicar filtro de fechas solo si hay fechas válidas
      if (dateFilterQuery.gte && dateFilterQuery.gte !== "") {
        completedPhotosQuery = completedPhotosQuery.gte("photos_completed_date", dateFilterQuery.gte)
      }
      if (dateFilterQuery.lte && dateFilterQuery.lte !== "") {
        completedPhotosQuery = completedPhotosQuery.lte("photos_completed_date", dateFilterQuery.lte)
      }

      const { data: completedPhotos, error: completedError } = await completedPhotosQuery

      if (completedError) {
        console.error("Error al obtener fotos completadas:", completedError)
        throw completedError
      }

      console.log("Fotos completadas obtenidas:", completedPhotos?.length || 0)

      // Obtener fotos pendientes por fotógrafo (excluyendo vendidos sin fotos y errores)
      const { data: allPendingPhotos, error: pendingError } = await supabase
        .from("fotos")
        .select("assigned_to, license_plate, photos_completed, estado_pintura")
        .eq("photos_completed", false)

      if (pendingError) {
        console.error("Error al obtener fotos pendientes:", pendingError)
        throw pendingError
      }

      console.log("Fotos pendientes obtenidas:", allPendingPhotos?.length || 0)

      // Obtener vehículos vendidos para filtrarlos
      const { data: soldVehicles, error: soldError } = await supabase
        .from("sales_vehicles")
        .select("license_plate")

      if (soldError) {
        console.error("Error al obtener vehículos vendidos:", soldError)
        throw soldError
      }

      console.log("Vehículos vendidos obtenidos:", soldVehicles?.length || 0)

      // Obtener vehículos reservados en duc_scraper
      let reservedVehicles = null
      let reservedError = null
      
      try {
        const { data, error } = await supabase
          .from("duc_scraper")
          .select("Matrícula")
          .eq("Estado", "reservado")
        
        reservedVehicles = data
        reservedError = error
      } catch (error) {
        console.log("Error al consultar duc_scraper:", error)
        reservedError = error
      }

      if (reservedError) {
        console.log("Error al obtener vehículos reservados:", reservedError)
        // Intentar obtener todos los registros para ver qué valores hay
        try {
          const { data: allDucData, error: allDucError } = await supabase
            .from("duc_scraper")
            .select("Matrícula, Estado")
            .limit(10)
          
          if (!allDucError && allDucData) {
            console.log("Valores de Estado disponibles:", [...new Set(allDucData.map(item => item.Estado))])
          }
        } catch (debugError) {
          console.log("No se pudo obtener valores de debug:", debugError)
        }
        
        // Continuar sin los reservados por ahora
        console.log("Continuando sin filtrar reservados...")
      }

      console.log("Vehículos reservados obtenidos:", reservedVehicles?.length || 0)

      // Crear listas de vehículos vendidos/reservados
      const soldLicensePlates = soldVehicles?.map(v => v.license_plate) || []
      const reservedLicensePlates = reservedVehicles?.map(v => v.Matrícula) || []
      const allSoldOrReserved = [...soldLicensePlates, ...reservedLicensePlates]

      console.log("Total vehículos vendidos/reservados:", allSoldOrReserved.length)
      console.log("Vehículos vendidos:", soldLicensePlates.length)
      console.log("Vehículos reservados:", reservedLicensePlates.length)

      // Filtrar pendientes (excluir vendidos sin fotos y errores)
      const pendingPhotos = allPendingPhotos?.filter(photo => {
        // Aplicar la misma lógica que photos-table.tsx
        // Excluir si está vendido o reservado
        if (allSoldOrReserved.includes(photo.license_plate)) {
          console.log("Excluyendo vehículo vendido/reservado:", photo.license_plate)
          return false
        }
        // Excluir si estado_pintura es "vendido"
        if (photo.estado_pintura === "vendido") {
          console.log("Excluyendo vehículo con estado vendido:", photo.license_plate)
          return false
        }
        return true
      }) || []

      console.log("Fotos pendientes después del filtro:", pendingPhotos.length)
      console.log("Vehículos excluidos:", allPendingPhotos?.length - pendingPhotos.length)
      console.log("Lista de vehículos vendidos/reservados:", allSoldOrReserved)

      // Calcular estadísticas por fotógrafo
      const statsByPhotographer: { [key: string]: any } = {}
      
      // Contar fotos completadas
      completedPhotos?.forEach(photo => {
        if (photo.assigned_to) {
          if (!statsByPhotographer[photo.assigned_to]) {
            statsByPhotographer[photo.assigned_to] = {
              completed: 0,
              pending: 0,
              total: 0
            }
          }
          statsByPhotographer[photo.assigned_to].completed++
        }
      })

      // Contar fotos pendientes (ya filtradas)
      pendingPhotos.forEach(photo => {
        if (photo.assigned_to) {
          if (!statsByPhotographer[photo.assigned_to]) {
            statsByPhotographer[photo.assigned_to] = {
              completed: 0,
              pending: 0,
              total: 0
            }
          }
          statsByPhotographer[photo.assigned_to].pending++
        }
      })

      console.log("Estadísticas por fotógrafo:", statsByPhotographer)

      // Calcular totales y promedios
      Object.keys(statsByPhotographer).forEach(photographerId => {
        const stats = statsByPhotographer[photographerId]
        stats.total = stats.completed + stats.pending
      })

      // Crear array de estadísticas
      const statsArray = photographers.map(p => {
        const stats = statsByPhotographer[p.user_id] || { completed: 0, pending: 0, total: 0 }
        return {
          id: p.id,
          user_id: p.user_id,
          avatar_url: p.avatar_url,
          name: p.full_name || p.email,
          percentage: p.percentage,
          photos_completed: stats.completed,
          photos_pending: stats.pending,
          total_photos: stats.total,
          is_active: p.is_active,
          is_locked: p.is_locked,
          is_hidden: p.is_hidden
        }
      }).filter(stat => stat.is_active && !stat.is_hidden && stat.total_photos > 0) // Solo activos, no ocultos y con datos

      console.log("Array de estadísticas final:", statsArray)

      setPhotographerStats(statsArray)
      console.log("Estadísticas cargadas exitosamente")
      
    } catch (error) {
      console.error("Error detallado al cargar estadísticas:", error)
      // Solo mostrar toast si no es modo solo lectura
      if (!readOnly) {
        toast({
          title: "Error al cargar estadísticas",
          description: "No se pudieron cargar las estadísticas. Revisa la consola para más detalles.",
          variant: "destructive",
        })
      }
    } finally {
      console.log("loadRealStats completado")
      setIsLoadingStats(false)
    }
  }

  // Función para generar informe de distribución equitativa
  const generateDistributionReport = async () => {
    try {
      // Obtener datos actuales
      const { data: allPhotos, error } = await supabase
        .from("fotos")
        .select("assigned_to, photos_completed, photos_completed_date")
        .not("assigned_to", "is", null)

      if (error) throw error

      // Calcular estadísticas por fotógrafo
      const photographerData: { [key: string]: any } = {}
      
      allPhotos?.forEach(photo => {
        if (!photographerData[photo.assigned_to]) {
          photographerData[photo.assigned_to] = {
            total_assigned: 0,
            completed: 0,
            pending: 0,
            percentage: 0
          }
        }
        photographerData[photo.assigned_to].total_assigned++
        if (photo.photos_completed) {
          photographerData[photo.assigned_to].completed++
        } else {
          photographerData[photo.assigned_to].pending++
        }
      })

      // Obtener porcentajes configurados
      const { data: photographersConfig } = await supabase
        .from("fotos_asignadas")
        .select("user_id, percentage, is_locked")
        .eq("is_active", true)

      // Añadir porcentajes configurados
      photographersConfig?.forEach(p => {
        if (photographerData[p.user_id]) {
          photographerData[p.user_id].configured_percentage = p.percentage
          photographerData[p.user_id].is_locked = p.is_locked
        }
      })

      // Calcular distribución equitativa
      const totalPhotos = allPhotos?.length || 0
      const reportData = Object.keys(photographerData).map(userId => {
        const data = photographerData[userId]
        const photographer = photographers.find(p => p.user_id === userId)
        
        return {
          name: photographer?.full_name || photographer?.email || userId,
          configured_percentage: data.configured_percentage || 0,
          total_assigned: data.total_assigned,
          completed: data.completed,
          pending: data.pending,
          is_locked: data.is_locked,
          actual_percentage: totalPhotos > 0 ? (data.total_assigned / totalPhotos) * 100 : 0,
          deficit: data.configured_percentage - (totalPhotos > 0 ? (data.total_assigned / totalPhotos) * 100 : 0)
        }
      })

      // Mostrar informe en consola y toast
      console.log("=== INFORME DE DISTRIBUCIÓN EQUITATIVA ===")
      console.table(reportData)
      
      const totalDeficit = reportData.reduce((sum, p) => sum + Math.abs(p.deficit), 0)
      const averageDeficit = totalDeficit / reportData.length

      toast({
        title: "Informe de Distribución",
        description: `Distribución actual: ${averageDeficit.toFixed(1)}% de desviación promedio. Revisa la consola para detalles.`,
      })

      return reportData
    } catch (error) {
      console.error("Error al generar informe:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el informe de distribución.",
        variant: "destructive",
      })
    }
  }

  // Función para generar informe detallado con análisis temporal
  const generateDetailedReport = async (readOnly = false) => {
    if (!canEdit() && !readOnly) {
      toast({
        title: "Acceso denegado",
        description: "No tienes privilegios para realizar esta acción.",
        variant: "destructive",
      })
      return
    }

    try {
      // Obtener datos con filtro temporal (últimos 30 días por defecto)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: photosData, error } = await supabase
        .from("fotos")
        .select("assigned_to, photos_completed, photos_completed_date, created_at, license_plate, estado_pintura")
        .gte("created_at", thirtyDaysAgo.toISOString())

      if (error) throw error

      // Obtener configuración de fotógrafos
      const { data: photographersConfig } = await supabase
        .from("fotos_asignadas")
        .select("user_id, percentage, is_locked, full_name, email")
        .eq("is_active", true)
        .eq("is_hidden", false)

      // Calcular estadísticas detalladas
      const detailedStats = photographersConfig?.map(p => {
        const photographerPhotos = photosData?.filter(photo => photo.assigned_to === p.user_id) || []
        const completedPhotos = photographerPhotos.filter(photo => photo.photos_completed)
        const pendingPhotos = photographerPhotos.filter(photo => !photo.photos_completed)

        // Calcular tiempos promedio
        const completionTimes = completedPhotos
          .filter(photo => photo.photos_completed_date && photo.created_at)
          .map(photo => {
            const created = new Date(photo.created_at)
            const completed = new Date(photo.photos_completed_date)
            return (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // días
          })

        const avgCompletionTime = completionTimes.length > 0
          ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
          : 0

        return {
          name: p.full_name || p.email || p.user_id,
          user_id: p.user_id,
          configured_percentage: p.percentage,
          is_locked: p.is_locked,
          total_assigned: photographerPhotos.length,
          completed: completedPhotos.length,
          pending: pendingPhotos.length,
          avg_completion_time: avgCompletionTime,
          completion_rate: photographerPhotos.length > 0 ? (completedPhotos.length / photographerPhotos.length) * 100 : 0
        }
      }) || []

      // Generar PDF
      const doc = new jsPDF()
      
      // Configurar fuente y colores
      doc.setFont("helvetica")
      doc.setFontSize(20)
      
      // Título principal
      doc.setTextColor(44, 62, 80)
      doc.text("INFORME DETALLADO DE FOTÓGRAFOS", 105, 20, { align: "center" })
      
      // Información del período
      doc.setFontSize(12)
      doc.setTextColor(52, 73, 94)
      doc.text(`Período: ${thirtyDaysAgo.toLocaleDateString('es-ES')} - ${new Date().toLocaleDateString('es-ES')}`, 105, 35, { align: "center" })
      
      // Estadísticas generales
      const totalPhotos = photosData?.length || 0
      const totalCompleted = photosData?.filter(p => p.photos_completed).length || 0
      const totalPending = photosData?.filter(p => !p.photos_completed).length || 0
      const generalCompletionRate = totalPhotos > 0 ? (totalCompleted / totalPhotos) * 100 : 0
      
      doc.setFontSize(14)
      doc.setTextColor(41, 128, 185)
      doc.text("ESTADÍSTICAS GENERALES", 20, 55)
      
      doc.setFontSize(10)
      doc.setTextColor(52, 73, 94)
      doc.text(`Total de fotos: ${totalPhotos}`, 20, 65)
      doc.text(`Fotos completadas: ${totalCompleted}`, 20, 72)
      doc.text(`Fotos pendientes: ${totalPending}`, 20, 79)
      doc.text(`Tasa de completado: ${generalCompletionRate.toFixed(1)}%`, 20, 86)
      
      // Tabla de fotógrafos
      doc.setFontSize(14)
      doc.setTextColor(41, 128, 185)
      doc.text("DETALLE POR FOTÓGRAFO", 20, 105)
      
      // Preparar datos para la tabla
      const tableData = detailedStats.map(stat => [
        stat.name,
        `${stat.configured_percentage}%`,
        stat.total_assigned.toString(),
        stat.completed.toString(),
        stat.pending.toString(),
        `${stat.completion_rate.toFixed(1)}%`,
        `${stat.avg_completion_time.toFixed(1)} días`,
        stat.is_locked ? "Sí" : "No"
      ])
      
      // Crear tabla
      autoTable(doc, {
        head: [['Fotógrafo', '% Config', 'Total', 'Completadas', 'Pendientes', 'Tasa %', 'Tiempo Prom', 'Bloqueado']],
        body: tableData,
        startY: 115,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      })
      
      // Gráfico de rendimiento (texto)
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(14)
      doc.setTextColor(41, 128, 185)
      doc.text("ANÁLISIS DE RENDIMIENTO", 20, finalY)
      
      doc.setFontSize(10)
      doc.setTextColor(52, 73, 94)
      
      // Encontrar mejor y peor fotógrafo
      const sortedByRate = [...detailedStats].sort((a, b) => b.completion_rate - a.completion_rate)
      const bestPhotographer = sortedByRate[0]
             const worstPhotographer = sortedByRate[sortedByRate.length - 1]
      
      doc.text(`Mejor rendimiento: ${bestPhotographer?.name} (${bestPhotographer?.completion_rate.toFixed(1)}%)`, 20, finalY + 10)
      doc.text(`Menor rendimiento: ${worstPhotographer?.name} (${worstPhotographer?.completion_rate.toFixed(1)}%)`, 20, finalY + 17)
      
      // Recomendaciones
      doc.setFontSize(14)
      doc.setTextColor(41, 128, 185)
      doc.text("RECOMENDACIONES", 20, finalY + 35)
      
      doc.setFontSize(10)
      doc.setTextColor(52, 73, 94)
      
      if (generalCompletionRate < 70) {
        doc.text("• La tasa de completado general es baja. Considerar revisar procesos.", 20, finalY + 45)
      }
      
      const lowPerformers = detailedStats.filter(s => s.completion_rate < 50)
      if (lowPerformers.length > 0) {
        doc.text(`• ${lowPerformers.length} fotógrafo(s) con rendimiento bajo (<50%)`, 20, finalY + 52)
      }
      
      const highPerformers = detailedStats.filter(s => s.completion_rate > 80)
      if (highPerformers.length > 0) {
        doc.text(`• ${highPerformers.length} fotógrafo(s) con excelente rendimiento (>80%)`, 20, finalY + 59)
      }
      
      // Pie de página
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 105, pageHeight - 10, { align: "center" })
      
      // Guardar PDF
      const fileName = `informe_fotografos_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      // Mostrar toast con resumen
      toast({
        title: "Informe PDF generado",
        description: `${fileName} descargado con éxito. Período: ${thirtyDaysAgo.toLocaleDateString('es-ES')} - ${new Date().toLocaleDateString('es-ES')}`,
      })

      return detailedStats
    } catch (error) {
      console.error("Error al generar informe detallado:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el informe PDF.",
        variant: "destructive",
      })
    }
  }

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${info}`])
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      console.log("Iniciando fetchData...")
      
      // Obtener fotógrafos asignados
      const { data: photographersData, error: photographersError } = await supabase
        .from("fotos_asignadas")
        .select("*")
        .order("created_at", { ascending: false })

      if (photographersError) {
        console.error("Error al obtener fotógrafos:", photographersError)
        setError("Error al cargar fotógrafos")
        return
      }

      // Obtener todos los usuarios
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .order("full_name", { ascending: true })

      if (usersError) {
        console.error("Error al obtener usuarios:", usersError)
        setError("Error al cargar usuarios")
        return
      }

      console.log("Datos cargados exitosamente")
      
      // Combinar datos de fotógrafos con datos de usuarios
      const combinedPhotographers = photographersData?.map(photographer => {
        const userData = usersData?.find(user => user.id === photographer.user_id)
        return {
          ...photographer,
          email: userData?.email,
          full_name: userData?.full_name,
          avatar_url: userData?.avatar_url
        }
      }) || []
      
      setPhotographers(combinedPhotographers || [])
      setAllUsers(usersData || [])
      setError(null)
      
      // Calcular el porcentaje total después de cargar los datos
      const activePhotographers = combinedPhotographers?.filter((p) => p.is_active && !p.is_hidden) || []
      const total = activePhotographers.reduce((sum, p) => sum + p.percentage, 0)
      setTotalPercentage(total)
      
      console.log("Porcentaje total calculado después de cargar datos:", total)
    } catch (error) {
      console.error("Error en fetchData:", error)
      setError("Error al cargar datos")
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar porcentaje de asignación
  const handlePercentageChange = (index: number, value: number[]) => {
    const updatedPhotographers = [...photographers]
    updatedPhotographers[index].percentage = value[0]
    setPhotographers(updatedPhotographers)

    // Actualizar el porcentaje total (solo fotógrafos activos y no ocultos)
    const total = updatedPhotographers.filter((p) => p.is_active && !p.is_hidden).reduce((sum, p) => sum + p.percentage, 0)
    setTotalPercentage(total)
  }

  // Actualizar estado activo
  const handleActiveChange = (index: number, value: boolean) => {
    const updatedPhotographers = [...photographers]
    updatedPhotographers[index].is_active = value
    setPhotographers(updatedPhotographers)

    // Actualizar el porcentaje total (solo fotógrafos activos y no ocultos)
    const total = updatedPhotographers.filter((p) => p.is_active && !p.is_hidden).reduce((sum, p) => sum + p.percentage, 0)
    setTotalPercentage(total)
  }

  // Cambiar el estado de bloqueo solo en el estado local
  const handleLockChange = async (index: number, value: boolean) => {
    const photographer = photographers[index]
    if (!photographer?.id) return

    setIsSaving(true)
    try {
      // Actualizar en la base de datos inmediatamente
      const { error } = await supabase
        .from("fotos_asignadas")
        .update({ 
          is_locked: value, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", photographer.id)

      if (error) throw error

      // Actualizar estado local
      const updatedPhotographers = [...photographers]
      updatedPhotographers[index].is_locked = value
      setPhotographers(updatedPhotographers)

      toast({
        title: value ? "Fotógrafo bloqueado" : "Fotógrafo desbloqueado",
        description: `El fotógrafo ha sido ${value ? 'bloqueado' : 'desbloqueado'} correctamente.`,
      })
    } catch (error) {
      console.error("Error al cambiar estado de bloqueo:", error)
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de bloqueo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Guardar cambios
  const handleSaveChanges = async () => {
    setIsSaving(true)
    setSuccessMessage(null)
    try {
      // Verificar que los porcentajes suman 100% (solo fotógrafos activos y no ocultos)
      const activePhotographers = photographers.filter((p) => p.is_active && !p.is_hidden)
      const totalPercentage = activePhotographers.reduce((sum, p) => sum + p.percentage, 0)

      if (activePhotographers.length > 0 && totalPercentage !== 100) {
        toast({
          title: "Error",
          description:
            "Los porcentajes de fotógrafos activos deben sumar 100%. Actualmente suman " + totalPercentage + "%.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // Guardar todos los cambios de porcentaje e is_locked
      for (const photographer of photographers) {
        // Eliminar campos que no están en la tabla
        const { email, full_name, avatar_url, ...updateData } = photographer
        // Solo actualiza si el fotógrafo ya existe en la base de datos
        if (photographer.id) {
          const { error } = await supabase.from("fotos_asignadas").update(updateData).eq("id", photographer.id)
          if (error) throw error
        }
      }

      setSuccessMessage("Los cambios en las asignaciones de fotógrafos se han guardado correctamente.")
      toast({
        title: "Cambios guardados",
        description: "Los cambios en las asignaciones de fotógrafos se han guardado correctamente.",
      })
      fetchData()
    } catch (error) {
      console.error("Error al guardar cambios:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Añadir nuevo fotógrafo desde la lista
  const handleAddPhotographer = async () => {
    if (!canEdit()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes privilegios para realizar esta acción.",
        variant: "destructive",
      })
      return
    }

    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un usuario.",
        variant: "destructive",
      })
      return
    }

    try {
      // Obtener el usuario seleccionado
      const selectedUser = allUsers.find((user) => user.id === selectedUserId)

      if (!selectedUser) {
        toast({
          title: "Error",
          description: "Usuario no encontrado. Por favor, selecciona otro usuario.",
          variant: "destructive",
        })
        return
      }

      // Insertar nuevo fotógrafo
      const { data, error } = await supabase
        .from("fotos_asignadas")
        .insert({
          user_id: selectedUserId,
          percentage: 0,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Actualizar lista de fotógrafos
      fetchData()
      setSelectedUserId("")

      toast({
        title: "Fotógrafo añadido",
        description: "El nuevo fotógrafo ha sido añadido correctamente.",
      })
    } catch (error) {
      console.error("Error al añadir fotógrafo:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el fotógrafo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Añadir nuevo fotógrafo manualmente
  const handleAddManualPhotographer = async () => {
    if (!newEmail || !newManualUserId) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el email y el ID del usuario.",
        variant: "destructive",
      })
      return
    }

    try {
      // Verificar si el usuario ya existe
      const { data: existingPhotographers, error: checkError } = await supabase
        .from("fotos_asignadas")
        .select("id")
        .eq("user_id", newManualUserId)

      if (checkError) throw checkError

      if (existingPhotographers && existingPhotographers.length > 0) {
        toast({
          title: "Error",
          description: "Este usuario ya está asignado como fotógrafo.",
          variant: "destructive",
        })
        return
      }

      // Insertar nuevo fotógrafo
      const { data, error } = await supabase
        .from("fotos_asignadas")
        .insert({
          user_id: newManualUserId,
          percentage: 0,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Actualizar lista de fotógrafos
      fetchData()
      setNewEmail("")
      setNewManualUserId("")

      toast({
        title: "Fotógrafo añadido",
        description: "El nuevo fotógrafo ha sido añadido correctamente.",
      })
    } catch (error) {
      console.error("Error al añadir fotógrafo:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el fotógrafo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Eliminar fotógrafo
  const handleDeletePhotographer = async (id: string, email: string) => {
    if (!canEdit()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes privilegios para realizar esta acción.",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar al fotógrafo ${email}?`)) {
      return
    }

    try {
      const { error } = await supabase.from("fotos_asignadas").delete().eq("id", id)

      if (error) throw error

      // Actualizar lista de fotógrafos
      fetchData()

      toast({
        title: "Fotógrafo eliminado",
        description: `El fotógrafo ${email} ha sido eliminado correctamente.`,
      })
    } catch (error) {
      console.error("Error al eliminar fotógrafo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el fotógrafo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Distribuir porcentajes equitativamente entre fotógrafos activos (respetando bloqueos)
  const distributePercentages = () => {
    if (!canEdit()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes privilegios para realizar esta acción.",
        variant: "destructive",
      })
      return
    }

    const activePhotographers = photographers.filter((p) => p.is_active && !p.is_hidden)
    const lockedPhotographers = activePhotographers.filter((p) => p.is_locked)
    const unlockedPhotographers = activePhotographers.filter((p) => !p.is_locked)

    if (unlockedPhotographers.length === 0) {
      toast({
        title: "Error",
        description: "No hay fotógrafos activos y desbloqueados para distribuir porcentajes.",
        variant: "destructive",
      })
      return
    }

    // Calcular el porcentaje total bloqueado
    const totalLockedPercentage = lockedPhotographers.reduce((sum, p) => sum + p.percentage, 0)
    const availablePercentage = 100 - totalLockedPercentage

    if (availablePercentage < 0) {
      toast({
        title: "Error",
        description: `Los fotógrafos bloqueados suman ${totalLockedPercentage}%. No hay porcentaje disponible para distribuir.`,
        variant: "destructive",
      })
      return
    }

    const equalPercentage = Math.floor(availablePercentage / unlockedPhotographers.length)
    let remainder = availablePercentage - equalPercentage * unlockedPhotographers.length

    const updatedPhotographers = [...photographers]

    updatedPhotographers.forEach((photographer) => {
      if (photographer.is_active && !photographer.is_hidden) {
        if (photographer.is_locked) {
          // Mantener el porcentaje bloqueado sin cambios
        } else {
          // Asignar porcentaje equitativo a los desbloqueados
          photographer.percentage = equalPercentage
        }
      } else {
        photographer.percentage = 0
      }
    })

    // Distribuir el resto entre los primeros fotógrafos desbloqueados
    if (remainder > 0) {
      for (const photographer of updatedPhotographers) {
        if (photographer.is_active && !photographer.is_hidden && !photographer.is_locked && remainder > 0) {
          photographer.percentage += 1
          remainder -= 1
        }
      }
    }

    setPhotographers(updatedPhotographers)
    
    // Calcular el nuevo total (solo fotógrafos activos y no ocultos)
    const newTotal = updatedPhotographers
      .filter((p) => p.is_active && !p.is_hidden)
      .reduce((sum, p) => sum + p.percentage, 0)
    setTotalPercentage(newTotal)
  }

  // Reasignar fotógrafos a vehículos pendientes
  const handleReassignPhotographers = async () => {
    if (!canEdit()) {
      toast({
        title: "Acceso denegado",
        description: "No tienes privilegios para realizar esta acción.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Obtener TODOS los vehículos pendientes (con o sin fotógrafo asignado)
      const { data: pendingVehicles, error: vehiclesError } = await supabase
        .from("fotos")
        .select("id, license_plate, assigned_to")
        .eq("photos_completed", false)

      if (vehiclesError) throw vehiclesError

      if (!pendingVehicles || pendingVehicles.length === 0) {
        toast({
          title: "No hay vehículos pendientes",
          description: "No hay vehículos pendientes para reasignar.",
        })
        return
      }

      // Verificar si hay vehículos con fotógrafo asignado para reasignar
      const vehiclesWithPhotographer = pendingVehicles.filter(v => v.assigned_to)
      const vehiclesWithoutPhotographer = pendingVehicles.filter(v => !v.assigned_to)

      if (vehiclesWithPhotographer.length === 0) {
        toast({
          title: "No hay vehículos para reasignar",
          description: "Todos los vehículos pendientes ya están correctamente asignados o no tienen fotógrafo.",
        })
        return
      }

      // Obtener fotógrafos activos con sus porcentajes
      const { data: photographers, error: photographersError } = await supabase
        .from("fotos_asignadas")
        .select("user_id, percentage, is_locked")
        .eq("is_active", true)
        .eq("is_hidden", false)

      if (photographersError) throw photographersError

      if (!photographers || photographers.length === 0) {
        toast({
          title: "No hay fotógrafos activos",
          description: "No hay fotógrafos activos para asignar vehículos.",
          variant: "destructive",
        })
        return
      }

      // Crear array de fotógrafos con sus pesos para asignación
      const photographersWithWeights = photographers.map(p => ({
        user_id: p.user_id,
        percentage: p.percentage,
        is_locked: p.is_locked,
        current_assignments: 0
      }))

      // Contar asignaciones actuales de cada fotógrafo (solo pendientes)
      pendingVehicles.forEach(vehicle => {
        if (vehicle.assigned_to) {
          const photographer = photographersWithWeights.find(p => p.user_id === vehicle.assigned_to)
          if (photographer) {
            photographer.current_assignments++
          }
        }
      })

      // Obtener fotos completadas por fotógrafo para calcular el déficit de sufrimiento
      const { data: completedPhotosData, error: completedError } = await supabase
        .from("fotos")
        .select("assigned_to")
        .eq("photos_completed", true)

      if (completedError) throw completedError

      // Contar fotos completadas por fotógrafo
      const completedPhotosByPhotographer: { [key: string]: number } = {}
      completedPhotosData?.forEach(photo => {
        if (photo.assigned_to) {
          completedPhotosByPhotographer[photo.assigned_to] = (completedPhotosByPhotographer[photo.assigned_to] || 0) + 1
        }
      })

      // Reasignar TODOS los vehículos pendientes según los porcentajes
      let reassignedCount = 0
      for (const vehicle of pendingVehicles) {
        // Encontrar el fotógrafo con mayor déficit de sufrimiento (quien menos ha trabajado)
        let bestPhotographer = null
        let bestDeficit = -Infinity

        for (const photographer of photographersWithWeights) {
          if (photographer.percentage > 0) {
            // Calcular cuántos coches debería tener este fotógrafo según su porcentaje
            const targetAssignments = (photographer.percentage / 100) * pendingVehicles.length
            
            // Calcular cuántos coches ya ha hecho (menos trabajo = más déficit de sufrimiento)
            const completedPhotos = completedPhotosByPhotographer[photographer.user_id] || 0
            
            // El déficit de sufrimiento es: cuántos coches le faltan por sufrir
            const deficit = targetAssignments - completedPhotos
            
            if (deficit > bestDeficit) {
              bestDeficit = deficit
              bestPhotographer = photographer
            }
          }
        }

        if (bestPhotographer && bestPhotographer.user_id !== vehicle.assigned_to) {
          // Solo reasignar si es diferente al fotógrafo actual
          const { error: updateError } = await supabase
            .from("fotos")
            .update({ 
              assigned_to: bestPhotographer.user_id,
              original_assigned_to: bestPhotographer.user_id,
              updated_at: new Date().toISOString()
            })
            .eq("id", vehicle.id)

          if (updateError) throw updateError

          // Actualizar contadores
          if (vehicle.assigned_to) {
            const oldPhotographer = photographersWithWeights.find(p => p.user_id === vehicle.assigned_to)
            if (oldPhotographer) oldPhotographer.current_assignments--
          }
          bestPhotographer.current_assignments++
          reassignedCount++
        } else if (bestPhotographer) {
          // Si ya está asignado al fotógrafo correcto, solo actualizar contador
          bestPhotographer.current_assignments++
        }
      }

      toast({
        title: "Reasignación completada",
        description: `${reassignedCount} de ${pendingVehicles.length} vehículos pendientes han sido reasignados según los porcentajes configurados.`,
      })

    } catch (error) {
      console.error("Error al reasignar fotógrafos:", error)
      toast({
        title: "Error",
        description: "No se pudo reasignar los fotógrafos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Función para mostrar el estado actual de los fotógrafos
  const showCurrentPhotographersStatus = () => {
    console.log("=== ESTADO ACTUAL DE FOTÓGRAFOS ===")
    console.log("Fotógrafos en estado local:", photographers)
    
    const lockedPhotographers = photographers.filter((p) => p.is_locked)
    console.log("Fotógrafos bloqueados (estado local):", lockedPhotographers)
    console.log("Total porcentaje bloqueado:", lockedPhotographers.reduce((sum, p) => sum + p.percentage, 0))
    
    // Verificar datos reales en BD
    supabase.from("fotos_asignadas").select("*").then(({ data, error }) => {
      if (error) {
        console.error("Error al obtener datos de BD:", error)
        return
      }
      console.log("Datos reales en BD:", data)
      const realLocked = data?.filter(p => p.is_locked) || []
      console.log("Fotógrafos bloqueados en BD:", realLocked)
      console.log("Total porcentaje bloqueado en BD:", realLocked.reduce((sum, p) => sum + p.percentage, 0))
      
      toast({
        title: "Estado de fotógrafos",
        description: `Estado local: ${lockedPhotographers.length} bloqueados (${lockedPhotographers.reduce((sum, p) => sum + p.percentage, 0)}%). BD: ${realLocked.length} bloqueados (${realLocked.reduce((sum, p) => sum + p.percentage, 0)}%)`,
      })
    })
  }

  // Eliminar datos simulados y usar datos reales
  // const photographerStats = photographers.map((p) => ({
  //   id: p.id,
  //   avatar_url: p.avatar_url,
  //   name: p.full_name || p.email,
  //   photos_done: Math.floor(Math.random() * 100), // Simulado
  //   avg_apto_days: (Math.random() * 5 + 1).toFixed(1), // Simulado
  //   avg_photos_days: (Math.random() * 5 + 1).toFixed(1), // Simulado
  // })).filter((stat) => stat.photos_done > 0)

  // Función helper para verificar permisos de edición
    const canEdit = () => {
    return profile?.role && ["admin", "Supervisor", "Director"].some(r =>
      profile.role.split(",").map(x => x.trim()).includes(r)
    )
  }

  // Log para depuración del estado de fotógrafos activos y porcentajes
  const activePhotographers = photographers.filter((p) => p.is_active && !p.is_hidden)
  console.log("Photographers loaded:", photographers)
  console.log("Active photographers:", activePhotographers)
  console.log("Total assigned percentage:", totalPercentage)

  // Agregar logs detallados de los porcentajes
  activePhotographers.forEach((photographer, index) => {
    console.log(`Fotógrafo ${index + 1}: ${photographer.full_name || photographer.email || photographer.user_id} - Porcentaje: ${photographer.percentage}%`)
  })

  // Mensaje de error si no hay fotógrafos activos
  const showPhotographerError = activePhotographers.length === 0

  return (
    <div className="space-y-6 relative">
      {/* Card de porcentaje total: 100% ancho */}
      <div>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex flex-col gap-0">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Porcentaje total asignado</CardTitle>
              </div>
              <CardDescription>Gestiona el reparto de porcentaje entre los fotógrafos activos</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={distributePercentages}
                disabled={photographers.filter((p) => p.is_active && !p.is_hidden).length === 0 || !canEdit()}
              >
                Distribuir Equitativamente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReassignPhotographers}
                disabled={isSaving || !canEdit()}
              >
                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                Reasignar fotógrafos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">Porcentaje total asignado:</span>
                <Badge variant={totalPercentage === 100 ? "default" : "destructive"} className="ml-2">
                  {totalPercentage}%
                </Badge>
                {totalPercentage !== 100 && photographers.filter((p) => p.is_active && !p.is_hidden).length > 0 && (
                  <span className="ml-3 text-sm text-amber-600 whitespace-nowrap">
                    {totalPercentage < 100
                      ? `Faltan ${100 - totalPercentage}% por asignar`
                      : `Hay ${totalPercentage - 100}% asignados de más`}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
              <div
                className={`h-2.5 rounded-full ${totalPercentage === 100 ? "bg-green-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min(100, totalPercentage)}%` }}
              ></div>
            </div>
            {/* Información sobre fotógrafos bloqueados */}
            {(() => {
              const lockedPhotographers = photographers.filter((p) => p.is_locked && p.is_active)
              const totalLockedPercentage = lockedPhotographers.reduce((sum, p) => sum + p.percentage, 0)
              if (lockedPhotographers.length > 0) {
                return (
                  <div className="mt-3 p-3 bg-muted/30 border border-border rounded-md">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span className="font-medium">
                        {lockedPhotographers.length} fotógrafo{lockedPhotographers.length > 1 ? 's' : ''} bloqueado{lockedPhotographers.length > 1 ? 's' : ''}: {totalLockedPercentage}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Los fotógrafos bloqueados mantienen su porcentaje fijo y no se ven afectados por el reparto equitativo.
                    </p>
                  </div>
                )
              }
              return null
            })()}
          </CardContent>
        </Card>
      </div>

      {showPhotographerError && (
        <Alert variant="destructive" className="my-2">
          <AlertTitle>Error de carga de fotógrafos</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los fotógrafos activos o sus porcentajes. Puede que haya un problema de sesión, permisos o conexión.<br />
            Intenta recargar la página o revisa la consola para más detalles.
          </AlertDescription>
        </Alert>
      )}

      {/* Fila con cards de fotógrafos asignados y estadísticas */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Card de fotógrafos asignados: 2/3 */}
        <div className="md:w-2/3 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Fotógrafos Asignados</CardTitle>
                </div>
                <CardDescription>Activa, bloquea y gestiona los fotógrafos disponibles</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={showCurrentPhotographersStatus} title="Ver estado actual">
                  <BarChart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={generateDistributionReport} title="Generar informe de distribución">
                  <BarChart2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => generateDetailedReport(!canEdit())} title="Generar informe detallado">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setShowHidden((v) => !v)} title={showHidden ? "Ocultar usuarios ocultos" : "Ver usuarios ocultos"}>
                  {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading} title="Actualizar">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleSaveChanges} disabled={isSaving} title="Guardar Cambios">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ minWidth: 220 }}>Usuario</TableHead>
                    <TableHead style={{ minWidth: 220, width: 260 }}>Porcentaje</TableHead>
                    <TableHead style={{ width: 80 }}>Activo</TableHead>
                    <TableHead style={{ width: 100, paddingLeft: 0 }}>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filteredUsers = [...allUsers].filter((user) => {
                      const photographer = photographers.find((p) => p.user_id === user.id)
                      if (showHidden) return true
                      return !photographer?.is_hidden
                    })

                    const activeUsers = filteredUsers.filter(user => {
                      const photographer = photographers.find((p) => p.user_id === user.id)
                      return photographer?.is_active || false
                    }).sort((a, b) => {
                      const aName = (a.full_name || a.email || '').toLowerCase()
                      const bName = (b.full_name || b.email || '').toLowerCase()
                      return aName.localeCompare(bName)
                    })

                    const inactiveUsers = filteredUsers.filter(user => {
                      const photographer = photographers.find((p) => p.user_id === user.id)
                      return !(photographer?.is_active || false)
                    }).sort((a, b) => {
                      const aName = (a.full_name || a.email || '').toLowerCase()
                      const bName = (b.full_name || b.email || '').toLowerCase()
                      return aName.localeCompare(bName)
                    })

                    return [
                      // Usuarios activos
                      ...activeUsers.map((user, index) => {
                        const photographer = photographers.find((p) => p.user_id === user.id)
                        const isActive = photographer?.is_active || false
                        const percentage = photographer?.percentage ?? 0
                        const isHidden = photographer?.is_hidden || false
                        const isLocked = photographer?.is_locked || false
                        return (
                          <TableRow key={`active-${user.id}-${index}`} className={isHidden ? "opacity-60" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.avatar_url && (
                                  <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                                )}
                                <div>
                                  <div className="font-medium">{user.full_name || user.email}</div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="w-40" style={{ minWidth: 220, width: 260 }}>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[percentage]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  onValueChange={(value) => {
                                    if (photographer) {
                                      handlePercentageChange(photographers.findIndex((p) => p.user_id === user.id), value)
                                    }
                                  }}
                                  disabled={!isActive || isLocked || !canEdit()}
                                  className="w-[160px] md:w-[200px] lg:w-[220px] xl:w-[240px]"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-mono">{percentage}%</span>
                                  {isLocked && <Lock className="h-3 w-3 text-blue-500" title="Porcentaje bloqueado" />}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={isActive}
                                onCheckedChange={async (value) => {
                                  if (!canEdit()) {
                                    toast({
                                      title: "Acceso denegado",
                                      description: "No tienes privilegios para realizar esta acción.",
                                      variant: "destructive",
                                    })
                                    return
                                  }
                                  
                                  if (photographer) {
                                    handleActiveChange(photographers.findIndex((p) => p.user_id === user.id), value)
                                  } else if (value) {
                                    // Si no existe, crear el registro en la base de datos y en el estado
                                    setIsSaving(true)
                                    try {
                                      const { data, error } = await supabase
                                        .from("fotos_asignadas")
                                        .insert({
                                          user_id: user.id,
                                          percentage: 0,
                                          is_active: true,
                                          created_at: new Date().toISOString(),
                                          updated_at: new Date().toISOString(),
                                        })
                                        .select()
                                      if (error) throw error
                                      fetchData()
                                    } catch (e) {
                                      toast({
                                        title: "Error",
                                        description: "No se pudo activar el usuario como fotógrafo.",
                                        variant: "destructive",
                                      })
                                    } finally {
                                      setIsSaving(false)
                                    }
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="flex gap-2 pl-0" style={{ width: 100, paddingLeft: 0 }}>
                              {photographer && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={isLocked ? "Desbloquear porcentaje" : "Bloquear porcentaje"}
                                    onClick={() => handleLockChange(photographers.findIndex((p) => p.user_id === user.id), !isLocked)}
                                    disabled={!isActive || !canEdit()}
                                  >
                                    {isLocked ? <Unlock className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={isHidden ? "Mostrar usuario" : "Ocultar usuario"}
                                    onClick={async () => {
                                      if (!canEdit()) {
                                        toast({
                                          title: "Acceso denegado",
                                          description: "No tienes privilegios para realizar esta acción.",
                                          variant: "destructive",
                                        })
                                        return
                                      }
                                      
                                      setIsSaving(true)
                                      try {
                                        const { error } = await supabase
                                          .from("fotos_asignadas")
                                          .update({ is_hidden: !isHidden, updated_at: new Date().toISOString() })
                                          .eq("id", photographer.id)
                                        if (error) throw error
                                        fetchData()
                                      } catch (e) {
                                        toast({
                                          title: "Error",
                                          description: "No se pudo cambiar la visibilidad del usuario.",
                                          variant: "destructive",
                                        })
                                      } finally {
                                        setIsSaving(false)
                                      }
                                    }}
                                  >
                                    {isHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePhotographer(photographer.id, user.email || "")}
                                    disabled={isSaving || !canEdit()}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      }),
                      
                      // Separador si hay usuarios inactivos
                      inactiveUsers.length > 0 && (
                        <TableRow key="separator">
                          <TableCell colSpan={4} className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-px bg-border flex-1"></div>
                              <span className="text-xs font-medium text-muted-foreground px-2">
                                {inactiveUsers.length} usuario{inactiveUsers.length > 1 ? 's' : ''} inactivo{inactiveUsers.length > 1 ? 's' : ''}
                              </span>
                              <div className="h-px bg-border flex-1"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                      
                      // Usuarios inactivos
                      ...inactiveUsers.map((user, index) => {
                        const photographer = photographers.find((p) => p.user_id === user.id)
                        const isActive = photographer?.is_active || false
                        const percentage = photographer?.percentage ?? 0
                        const isHidden = photographer?.is_hidden || false
                        const isLocked = photographer?.is_locked || false
                        return (
                          <TableRow key={`inactive-${user.id}-${index}`} className={`${isHidden ? "opacity-60" : ""} bg-muted/5`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.avatar_url && (
                                  <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                                )}
                                <div>
                                  <div className="font-medium">{user.full_name || user.email}</div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="w-40" style={{ minWidth: 220, width: 260 }}>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[percentage]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  onValueChange={(value) => {
                                    if (photographer) {
                                      handlePercentageChange(photographers.findIndex((p) => p.user_id === user.id), value)
                                    }
                                  }}
                                  disabled={!isActive || isLocked || !canEdit()}
                                  className="w-[160px] md:w-[200px] lg:w-[220px] xl:w-[240px]"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-mono">{percentage}%</span>
                                  {isLocked && <Lock className="h-3 w-3 text-blue-500" title="Porcentaje bloqueado" />}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={isActive}
                                onCheckedChange={async (value) => {
                                  if (!canEdit()) {
                                    toast({
                                      title: "Acceso denegado",
                                      description: "No tienes privilegios para realizar esta acción.",
                                      variant: "destructive",
                                    })
                                    return
                                  }
                                  
                                  if (photographer) {
                                    handleActiveChange(photographers.findIndex((p) => p.user_id === user.id), value)
                                  } else if (value) {
                                    // Si no existe, crear el registro en la base de datos y en el estado
                                    setIsSaving(true)
                                    try {
                                      const { data, error } = await supabase
                                        .from("fotos_asignadas")
                                        .insert({
                                          user_id: user.id,
                                          percentage: 0,
                                          is_active: true,
                                          created_at: new Date().toISOString(),
                                          updated_at: new Date().toISOString(),
                                        })
                                        .select()
                                      if (error) throw error
                                      fetchData()
                                    } catch (e) {
                                      toast({
                                        title: "Error",
                                        description: "No se pudo activar el usuario como fotógrafo.",
                                        variant: "destructive",
                                      })
                                    } finally {
                                      setIsSaving(false)
                                    }
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="flex gap-2 pl-0" style={{ width: 100, paddingLeft: 0 }}>
                              {photographer && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={isLocked ? "Desbloquear porcentaje" : "Bloquear porcentaje"}
                                    onClick={() => handleLockChange(photographers.findIndex((p) => p.user_id === user.id), !isLocked)}
                                    disabled={!isActive || !canEdit()}
                                  >
                                    {isLocked ? <Unlock className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={isHidden ? "Mostrar usuario" : "Ocultar usuario"}
                                    onClick={async () => {
                                      if (!canEdit()) {
                                        toast({
                                          title: "Acceso denegado",
                                          description: "No tienes privilegios para realizar esta acción.",
                                          variant: "destructive",
                                        })
                                        return
                                      }
                                      
                                      setIsSaving(true)
                                      try {
                                        const { error } = await supabase
                                          .from("fotos_asignadas")
                                          .update({ is_hidden: !isHidden, updated_at: new Date().toISOString() })
                                          .eq("id", photographer.id)
                                        if (error) throw error
                                        fetchData()
                                      } catch (e) {
                                        toast({
                                          title: "Error",
                                          description: "No se pudo cambiar la visibilidad del usuario.",
                                          variant: "destructive",
                                        })
                                      } finally {
                                        setIsSaving(false)
                                      }
                                    }}
                                  >
                                    {isHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePhotographer(photographer.id, user.email || "")}
                                    disabled={isSaving || !canEdit()}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ].filter(Boolean)
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        {/* Card de estadísticas: 1/3 */}
        <div className="md:w-1/3 flex flex-col">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Estadísticas</CardTitle>
                </div>
                <CardDescription>Rendimiento y distribución de fotógrafos</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => loadRealStats(!canEdit())} disabled={isLoadingStats} title="Actualizar estadísticas">
                  <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => generateDetailedReport(!canEdit())} title="Generar informe detallado">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setShowDateFilter(!showDateFilter)} title="Filtrar por fecha">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              <div className="space-y-4">
                {/* Resumen rápido */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {photographerStats.reduce((sum, stat) => sum + stat.photos_completed, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Fotos completadas</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-2xl font-bold text-amber-600">
                      {photographerStats.reduce((sum, stat) => sum + stat.photos_pending, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Fotos pendientes</div>
                  </div>
                </div>

                {/* Tabla de estadísticas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Fotógrafos activos</h4>
                  <div className="space-y-2">
                    {isLoadingStats ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Cargando...</span>
                      </div>
                    ) : photographerStats.length > 0 ? (
                      photographerStats.map((stat, index) => (
                        <div key={`stat-${stat.id}-${index}`} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            {stat.avatar_url && (
                              <img src={stat.avatar_url} alt="avatar" className="w-6 h-6 rounded-full" />
                            )}
                            <div>
                              <div className="text-sm font-medium">{stat.name}</div>
                              <div className="text-xs text-muted-foreground">{stat.percentage}% configurado</div>
                            </div>
                            {stat.is_locked && <Lock className="h-3 w-3 text-blue-500" title="Bloqueado" />}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{stat.photos_completed}/{stat.total_photos}</div>
                            <div className="text-xs text-muted-foreground">
                              {stat.total_photos > 0 ? Math.round((stat.photos_completed / stat.total_photos) * 100) : 0}% completado
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No hay estadísticas disponibles
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Botón de expandir extras debajo de ambos cards */}
      <div className="flex justify-end mt-2">
        <button
          className="flex items-center gap-1 px-3 py-1 rounded bg-muted hover:bg-muted/70 border border-border text-muted-foreground text-xs shadow transition-colors"
          title={showExtras ? "Ocultar utilidades" : "Mostrar utilidades"}
          onClick={() => setShowExtras((v) => !v)}
        >
          <ChevronDown className="h-4 w-4" />
          <ChevronDown className="h-4 w-4 -ml-2" />
          <ChevronDown className="h-4 w-4 -ml-2" />
        </button>
      </div>

      {/* Resto del contenido: cards extras, etc. */}
      {/* Cards extras: Añadir Usuarios y Diagnóstico */}
      {showExtras && (
        <div className="space-y-6 animate-fade-in">
          {/* Añadir nuevo fotógrafo desde la lista */}
          <Card>
            <CardHeader>
              <CardTitle>Añadir Fotógrafo desde Lista de Usuarios</CardTitle>
              <CardDescription>{allUsers.length} usuarios disponibles encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              {allUsers.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-select" className="mb-2 block">
                      Seleccionar Usuario
                    </Label>
                    <select
                      id="user-select"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      <option value="">Seleccionar usuario...</option>
                                        {allUsers.map((user, index) => (
                    <option key={`option-${user.id}-${index}`} value={user.id}>
                          {user.email} {user.full_name ? `(${user.full_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleAddPhotographer}
                    disabled={!selectedUserId || isSaving || !canEdit()}
                    className="w-full"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Añadir Fotógrafo
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">No se encontraron usuarios disponibles.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Añadir nuevo fotógrafo manualmente */}
          <Card>
            <CardHeader>
              <CardTitle>Añadir Fotógrafo Manualmente</CardTitle>
              <CardDescription>Usa esta opción si no encuentras el usuario en la lista</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-email" className="mb-2 block">
                    Email del Fotógrafo
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    (Solo para referencia, no se guardará en la base de datos)
                  </p>
                </div>
                <div>
                  <Label htmlFor="new-user-id" className="mb-2 block">
                    ID del Usuario
                  </Label>
                  <Input
                    id="new-user-id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={newManualUserId}
                    onChange={(e) => setNewManualUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresa el ID de Supabase del usuario (formato UUID)
                  </p>
                </div>
                <Button onClick={handleAddManualPhotographer} disabled={!newEmail || !newManualUserId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Fotógrafo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Diagnóstico</CardTitle>
              <CardDescription>Detalles sobre la carga de datos y usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200 max-h-[400px] overflow-y-auto">
                {debugInfo.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    <p>No hay información de diagnóstico disponible.</p>
                    <p className="text-sm mt-2">
                      Haz clic en "Actualizar" para cargar los datos y generar información de diagnóstico.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1 text-sm font-mono">
                    {debugInfo.map((info, index) => (
                      <li key={index} className="border-b border-slate-100 pb-1">
                        {info}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Actualizar Diagnóstico
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usuarios Encontrados */}
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Encontrados</CardTitle>
              <CardDescription>Lista de todos los usuarios encontrados en las diferentes tablas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                                    allUsers.map((user, index) => (
                  <TableRow key={`debug-user-${user.id}-${index}`}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.full_name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de filtro de fechas */}
      {showDateFilter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filtrar por fecha</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowDateFilter(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="date-from">Desde</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFilter.from?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    setDateFilter(prev => ({ ...prev, from: date }))
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="date-to">Hasta</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateFilter.to?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    setDateFilter(prev => ({ ...prev, to: date }))
                  }}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDateFilter({ from: undefined, to: undefined })
                    setShowDateFilter(false)
                  }}
                >
                  Limpiar
                </Button>
                <Button 
                  onClick={() => {
                    loadRealStats()
                    setShowDateFilter(false)
                  }}
                >
                  Aplicar filtro
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de permisos */}
      {!canEdit() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Modo de solo lectura</AlertTitle>
          <AlertDescription>
            Solo puedes ver la información. Los administradores, supervisores y directores pueden realizar cambios.
          </AlertDescription>
        </Alert>
      )}

      {/* Pestañas principales */}
    </div>
  )
}
