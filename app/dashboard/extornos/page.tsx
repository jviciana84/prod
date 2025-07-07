"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Textarea } from "@/components/ui/textarea"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Badge } from "@/components/ui/badge"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import {
  ArrowRightLeft,
  Plus,
  Copy,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  User,
  CreditCard,
  Building,
  Calendar,
  Euro,
  Send,
  Check,
  Car,
  RefreshCw,
  Eye,
  UserCircle,
  Database,
  XCircle,
  Trash,
  FileText,
  Upload,
  Download,
  CreditCard as CreditCardIcon,
} from "lucide-react"

import { createClientComponentClient } from "@/lib/supabase/client"

import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

import { AlertTriangle } from "lucide-react"

import { DocumentUploaderCompact } from "@/components/extornos/document-uploader-compact"

interface DocumentMetadata {
  id: string
  nombre: string
  tipo: string
  tamaño: number
  url: string
  subido_en: string
}

interface ExtornoSolicitud {
  id: number
  matricula: string
  cliente: string
  numero_cliente: string | null
  concepto: string
  importe: number
  numero_cuenta: string
  concesion: number
  estado: "pendiente" | "tramitado" | "realizado" | "rechazado"
  fecha_solicitud: string
  fecha_tramitacion?: string
  fecha_realizacion?: string
  fecha_rechazo?: string
  solicitado_por?: string
  solicitado_por_email?: string
  solicitado_por_nombre?: string
  tramitado_por?: string
  realizado_por?: string
  rechazado_por?: string
  motivo_rechazo?: string
  justificante_url?: string
  justificante_nombre?: string
  created_at: string
  updated_at: string
  documentos_adjuntos?: DocumentMetadata[]
  documentos_tramitacion?: DocumentMetadata[]
}

// Función para formatear números en formato español
const formatearImporteEspanol = (importe: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(importe)
}

// Función para formatear fecha en formato español
const formatearFechaEspanol = (fecha: string) => {
  if (!fecha) return "N/A"
  const date = new Date(fecha)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Función para parsear importe desde formato español
const parsearImporteEspanol = (valor: string): number => {
  // Remover símbolo de euro y espacios
  const limpio = valor.replace(/[€\s]/g, "")
  // Reemplazar coma por punto para decimales
  const conPunto = limpio.replace(",", ".")
  // Remover puntos de miles (excepto el último que es decimal)
  const partes = conPunto.split(".")
  if (partes.length > 2) {
    // Hay puntos de miles
    const entero = partes.slice(0, -1).join("")
    const decimal = partes[partes.length - 1]
    return Number.parseFloat(`${entero}.${decimal}`)
  }
  return Number.parseFloat(conPunto) || 0
}

export default function ExtornosPage() {
  const [solicitudes, setSolicitudes] = useState<ExtornoSolicitud[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [rejectionMessage, setRejectionMessage] = useState<string>("")
  const [emailStates, setEmailStates] = useState<Record<string, "idle" | "sending" | "success" | "error">>({})

  // NEW: States for documents in the modal
  const [pendingFiles, setPendingFiles] = useState<File[]>([]) // For new extorno form, to hold File objects
  const [extornoTemporal, setExtornoTemporal] = useState<string | null>(null) // Changed to string for temp ID

  const [formData, setFormData] = useState({
    matricula: "",
    cliente: "",
    numero_cliente: "",
    concepto: "",
    importe: "",
    numero_cuenta: "",
    concesion: "",
  })

  const [selectedSolicitud, setSelectedSolicitud] = useState<ExtornoSolicitud | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [numeroCuentaError, setNumeroCuentaError] = useState("")
  
  // Estados para la nueva pestaña "Realizado"
  const [justificanteFile, setJustificanteFile] = useState<File | null>(null)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState("")
  const [defaultTab, setDefaultTab] = useState<string>("adjuntos")

  const supabase = createClientComponentClient()

  // Referencias para navegación con Enter
  const matriculaRef = useRef<HTMLInputElement>(null)
  const clienteRef = useRef<HTMLInputElement>(null)
  const numeroClienteRef = useRef<HTMLInputElement>(null)
  const importeRef = useRef<HTMLInputElement>(null)
  const conceptoRef = useRef<HTMLTextAreaElement>(null)
  const numeroCuentaRef = useRef<HTMLInputElement>(null)
  const concesionRef = useRef<HTMLButtonElement>(null)

  // Función para formatear número de cuenta (separar cada 4 dígitos)
  const formatearNumeroCuenta = (valor: string): string => {
    // Remover todos los espacios y caracteres no alfanuméricos
    const limpiado = valor.replace(/[^A-Za-z0-9]/g, '')
    
    // Si no hay contenido, devolver vacío
    if (!limpiado) return ''
    
    // Separar cada 4 caracteres con espacios
    const formateado = limpiado.match(/.{1,4}/g)?.join(' ') || limpiado
    
    return formateado.toUpperCase()
  }

  // Función para validar número de cuenta
  const validarNumeroCuenta = (valor: string): { esValido: boolean; mensaje: string } => {
    const limpiado = valor.replace(/[^A-Za-z0-9]/g, '')
    
    if (limpiado.length === 0) {
      return { esValido: false, mensaje: 'El número de cuenta es obligatorio' }
    }
    
    if (limpiado.length !== 24) {
      return { esValido: false, mensaje: `El número de cuenta debe tener exactamente 24 caracteres (actual: ${limpiado.length})` }
    }
    
    // Verificar que comience con letras
    if (!/^[A-Za-z]/.test(limpiado)) {
      return { esValido: false, mensaje: 'El número de cuenta debe comenzar con letras' }
    }
    
    return { esValido: true, mensaje: '' }
  }

  const handleKeyPress = (
    e: React.KeyboardEvent,
    nextRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      nextRef?.current?.focus()
    }
  }

  // Función para verificar la tabla
  const verificarTabla = async () => {
    try {
      console.log("🔍 Verificando tabla extornos...")

      // Intentar hacer una consulta simple para verificar si la tabla existe
      const { data, error, count } = await supabase.from("extornos").select("*", { count: "exact" }).limit(1)

      if (error) {
        console.error("❌ Error verificando tabla:", error)
        setDebugInfo(`Error tabla: ${error.message}`)
        return false
      }

      console.log("✅ Tabla extornos verificada. Registros:", count)
      setDebugInfo(`Tabla OK. Registros: ${count || 0}`)
      return true
    } catch (err: any) {
      console.error("❌ Excepción verificando tabla:", err)
      setDebugInfo(`Excepción: ${err.message}`)
      return false
    }
  }

  // Obtener usuario actual
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("🔐 Verificando sesión en extornos...")
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ Error al verificar sesión:", error)
          setError("Error de autenticación")
          setIsAuthenticated(false)
          setLoading(false)
          return false
        }

        if (!data.session) {
          console.log("⚠️ No hay sesión activa")
          setIsAuthenticated(false)
          setLoading(false)
          return false
        }

        console.log("✅ Sesión activa encontrada. Usuario:", data.session.user.email)
        setIsAuthenticated(true)
        setCurrentUser(data.session.user)

        // Obtener perfil del usuario
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single()

          if (profileData) {
            setUserProfile(profileData)
            console.log("✅ Perfil cargado:", profileData.full_name || profileData.email)
          }
        } catch (profileError) {
          console.error("⚠️ Error obteniendo perfil:", profileError)
        }

        // Verificar tabla después de autenticar
        await verificarTabla()

        return true
      } catch (err: any) {
        console.error("❌ Excepción al verificar sesión:", err)
        setError("Error al verificar sesión")
        setIsAuthenticated(false)
        setLoading(false)
        return false
      }
    }

    checkSession()
  }, [supabase])

  // 🔥 CARGAR SOLICITUDES CON JOIN MANUAL
  const cargarSolicitudes = async () => {
    try {
      if (!isAuthenticated) {
        console.log("⚠️ Usuario no autenticado, no se cargan solicitudes")
        return
      }

      setLoading(true)
      console.log("📥 Cargando solicitudes de extorno...")

      // Primero verificar la tabla
      const tablaOK = await verificarTabla()
      if (!tablaOK) {
        console.error("❌ La tabla extornos no está disponible")
        toast({
          title: "Error de base de datos",
          description: "La tabla de extornos no está disponible. Contacte al administrador.",
          variant: "destructive",
        })
        return
      }

      // 🔥 PASO 1: Cargar extornos sin JOIN
      console.log("📋 Cargando extornos...")
      const {
        data: extornosData,
        error: extornosError,
        count,
      } = await supabase
        .from("extornos")
        .select("*, documentos_adjuntos, documentos_tramitacion", { count: "exact" })
        .order("created_at", { ascending: false })

      if (extornosError) {
        console.error("❌ Error cargando extornos:", extornosError)
        toast({
          title: "Error",
          description: `No se pudieron cargar las solicitudes: ${extornosError.message}`,
          variant: "destructive",
        })
        return
      }

      console.log("✅ Extornos cargados:", extornosData?.length || 0)

      if (!extornosData || extornosData.length === 0) {
        console.log("ℹ️ No hay datos de extornos")
        setSolicitudes([])
        setLoading(false)
        return
      }

      // 🔥 PASO 2: Obtener IDs únicos de usuarios
      const userIds = [...new Set(extornosData.map((item) => item.solicitado_por).filter(Boolean))]
      console.log("👥 IDs de usuarios únicos:", userIds.length)

      // 🔥 PASO 3: Cargar perfiles de usuarios
      let profilesData: any[] = []
      if (userIds.length > 0) {
        console.log("📋 Cargando perfiles de usuarios...")
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)

        if (profilesError) {
          console.error("⚠️ Error cargando perfiles (continuando sin nombres):", profilesError)
        } else {
          profilesData = profiles || []
          console.log("✅ Perfiles cargados:", profilesData.length)
        }
      }

      // 🔥 PASO 4: Crear mapa de perfiles para lookup rápido
      const profilesMap = new Map()
      profilesData.forEach((profile) => {
        profilesMap.set(profile.id, profile)
      })

      // 🔥 PASO 5: Combinar datos (JOIN manual)
      const solicitudesProcesadas = extornosData.map((item) => {
        const profile = profilesMap.get(item.solicitado_por)
        return {
          ...item,
          solicitado_por_nombre: profile?.full_name || `Usuario ${item.solicitado_por?.slice(-8) || "desconocido"}`,
          solicitado_por_email: profile?.email || "Email no disponible",
        }
      })

      console.log("✅ Solicitudes procesadas con perfiles:", solicitudesProcesadas.length)
      console.log("📋 Muestra de datos procesados:", solicitudesProcesadas.slice(0, 2))
      setSolicitudes(solicitudesProcesadas)

      if (solicitudesProcesadas.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay solicitudes de extorno registradas.",
        })
      }
    } catch (error) {
      console.error("❌ Error general:", error)
      toast({
        title: "Error",
        description: "Error de conexión con la base de datos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated === true) {
      cargarSolicitudes()
    }
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validar número de cuenta antes de continuar
      const validacionCuenta = validarNumeroCuenta(formData.numero_cuenta)
      if (!validacionCuenta.esValido) {
        setNumeroCuentaError(validacionCuenta.mensaje)
        toast({
          title: "Error en número de cuenta",
          description: validacionCuenta.mensaje,
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      if (!currentUser?.id) {
        toast({
          title: "Error",
          description: "No se pudo identificar al usuario actual.",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      console.log("💾 Creando extorno con usuario:", currentUser.email)
      const importeNumerico = parsearImporteEspanol(formData.importe)

      // --- NEW: Upload pending files first ---
      const uploadedDocumentsMetadata: DocumentMetadata[] = []
      for (const file of pendingFiles) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("extornoId", "new") // Indicate it's a new extorno, ID will be assigned by DB
        formData.append("tipo", "adjunto") // Assuming these are always 'adjunto' for new submissions

        try {
          const uploadResponse = await fetch("/api/extornos/upload-document", {
            method: "POST",
            body: formData,
          })
          const uploadResult = await uploadResponse.json()

          if (uploadResponse.ok && uploadResult.success) {
            uploadedDocumentsMetadata.push(uploadResult.document)
          } else {
            console.error("❌ Error uploading file:", file.name, uploadResult.error)
            toast({
              title: "Error al subir archivo",
              description: `No se pudo subir "${file.name}": ${uploadResult.error || "Error desconocido"}`,
              variant: "destructive",
            })
            // Decide whether to continue or stop if a file upload fails
            // For now, we'll continue but log the error.
          }
        } catch (uploadError) {
          console.error("❌ Network error during file upload:", file.name, uploadError)
          toast({
            title: "Error de red",
            description: `No se pudo subir "${file.name}" debido a un error de red.`,
            variant: "destructive",
          })
        }
      }
      console.log("✅ Documentos subidos a Vercel Blob. Metadata:", uploadedDocumentsMetadata)
      // --- END NEW: Upload pending files ---

      const datosExtorno = {
        matricula: formData.matricula.toUpperCase(),
        cliente: formData.cliente,
        numero_cliente: formData.numero_cliente || null,
        concepto: formData.concepto,
        importe: importeNumerico,
        numero_cuenta: formData.numero_cuenta,
        concesion: Number.parseInt(formData.concesion),
        estado: "pendiente" as const,
        solicitado_por: currentUser.id,
        created_by: currentUser.id,
        documentos_adjuntos: uploadedDocumentsMetadata, // Use the uploaded metadata
        documentos_tramitacion: [],
      }

      console.log("📋 Datos a insertar en Supabase:", datosExtorno)

      const { data, error } = await supabase.from("extornos").insert([datosExtorno]).select()

      if (error) {
        console.error("❌ Error creando extorno:", error)
        console.error("❌ Detalles del error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })

        toast({
          title: "Error",
          description: `Error al crear extorno: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      console.log("✅ Extorno creado exitosamente en Supabase:", data)

      // 🔥 ENVIAR EMAIL CON ADJUNTOS AUTOMÁTICAMENTE
      try {
        console.log("📧 Enviando email automático con adjuntos para extorno:", data[0].id)

        const emailResponse = await fetch("/api/extornos/send-notification-with-attachments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            extorno_id: data[0].id,
            tipo: "registro",
            usuario_registra_email: currentUser.email,
            usuario_registra_nombre: userProfile?.full_name || currentUser.email,
            // Documents are fetched by the API route from the DB
          }),
        })

        const emailResult = await emailResponse.json()

        if (emailResponse.ok && emailResult.success) {
          console.log("✅ Email automático con adjuntos enviado correctamente")

          if (emailResult.estadisticas) {
            toast({
              title: "Extorno creado y email enviado",
              description: `Solicitud registrada. Email enviado con ${emailResult.estadisticas.adjuntos_incluidos} adjuntos.`,
            })
          }
        } else {
          console.error("❌ Error enviando email automático:", emailResult)
          toast({
            title: "Extorno creado",
            description: "Solicitud registrada, pero hubo un problema enviando el email.",
            variant: "destructive",
          })
        }
      } catch (emailError) {
        console.error("❌ Error crítico enviando email automático:", emailError)
        toast({
          title: "Extorno creado",
          description: "Solicitud registrada, pero hubo un problema enviando el email.",
          variant: "destructive",
        })
      }

      // Limpiar formulario y documentos
      setIsDialogOpen(false)
      setFormData({
        matricula: "",
        cliente: "",
        numero_cliente: "",
        concepto: "",
        importe: "",
        numero_cuenta: "",
        concesion: "",
      })
      setPendingFiles([]) // Clear pending files
      setExtornoTemporal(null)
      setNumeroCuentaError("") // Limpiar error del número de cuenta

      // Recargar solicitudes
      cargarSolicitudes()
    } catch (error) {
      console.error("❌ Error general:", error)
      toast({
        title: "Error",
        description: "Error inesperado al crear la solicitud.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // NEW: Function to open new extorno modal and reset document states
  const abrirModalNuevoExtorno = () => {
    const tempId = `temp-${Date.now()}` // Use a string for temporary ID
    setExtornoTemporal(tempId)
    setPendingFiles([]) // Clear pending files for new form
    setNumeroCuentaError("") // Limpiar error del número de cuenta
    setIsDialogOpen(true)
  }

  const enviarEmailTramitacion = async (solicitud: ExtornoSolicitud) => {
    const emailKey = `tramitacion_${solicitud.id}`
    setEmailStates((prev) => ({ ...prev, [emailKey]: "sending" }))

    try {
      console.log(`📧 Enviando email de tramitación para extorno: ${solicitud.id}`)

      const emailResponse = await fetch("/api/extornos/send-notification-with-attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extorno_id: solicitud.id,
          tipo: "tramitacion",
          usuario_registra_email: solicitud.solicitado_por_email,
          usuario_registra_nombre: solicitud.solicitado_por_nombre,
          usuario_tramita_email: currentUser.email,
          usuario_tramita_nombre: userProfile?.full_name || currentUser.email,
          // Documents are fetched by the API route from the DB
        }),
      })

      const emailResult = await emailResponse.json()

      if (emailResponse.ok && emailResult.success) {
        console.log("✅ Email de tramitación enviado correctamente")
        setEmailStates((prev) => ({ ...prev, [emailKey]: "success" }))

        toast({
          title: "Email enviado",
          description: "El email de tramitación ha sido enviado correctamente.",
        })

        // Actualizar estado del extorno a tramitado
        const { error } = await supabase
          .from("extornos")
          .update({
            estado: "tramitado",
            fecha_tramitacion: new Date().toISOString(),
            tramitado_por: currentUser.id,
          })
          .eq("id", solicitud.id)
        if (!error) {
          cargarSolicitudes()
        }

        // Limpiar estado después de 3 segundos
        setTimeout(() => {
          setEmailStates((prev) => {
            const newState = { ...prev }
            delete newState[emailKey]
            return newState
          })
        }, 3000)
      } else {
        console.error("❌ Error enviando email:", emailResult)
        setEmailStates((prev) => ({ ...prev, [emailKey]: "error" }))
        toast({
          title: "Error enviando email",
          description: `Error: ${emailResult.message}`,
          variant: "destructive",
        })
        // Limpiar estado después de 5 segundos
        setTimeout(() => {
          setEmailStates((prev) => {
            const newState = { ...prev }
            delete newState[emailKey]
            return newState
          })
        }, 5000)
      }
    } catch (error) {
      console.error("❌ Error crítico enviando email:", error)
      setEmailStates((prev) => ({ ...prev, [emailKey]: "error" }))
      toast({
        title: "Error crítico",
        description: "Error inesperado al enviar el email.",
        variant: "destructive",
      })
      // Limpiar estado después de 5 segundos
      setTimeout(() => {
        setEmailStates((prev) => {
          const newState = { ...prev }
          delete newState[emailKey]
          return newState
        })
      }, 5000)
    }
  }

  const rechazarExtorno = async (solicitud: ExtornoSolicitud) => {
    setSelectedSolicitud(solicitud)
    setIsRejectDialogOpen(true)
  }

  const confirmarRechazo = async () => {
    if (!selectedSolicitud) return

    const emailKey = `rechazo_${selectedSolicitud.id}`
    setEmailStates((prev) => ({ ...prev, [emailKey]: "sending" }))

    try {
      console.log("❌ Rechazando extorno:", selectedSolicitud.id)

      // Actualizar estado del extorno a rechazado
      const { error: updateError } = await supabase
        .from("extornos")
        .update({
          estado: "rechazado",
          fecha_rechazo: new Date().toISOString(),
          rechazado_por: currentUser.id,
          motivo_rechazo: motivoRechazo || "Sin motivo especificado",
        })
        .eq("id", selectedSolicitud.id)
      if (updateError) {
        console.error("❌ Error actualizando estado del extorno:", updateError)
        setEmailStates((prev) => ({ ...prev, [emailKey]: "error" }))
        toast({
          title: "Error rechazando extorno",
          description: `Error al actualizar el estado: ${updateError.message}`,
          variant: "destructive",
        })
        // Limpiar estado después de 5 segundos
        setTimeout(() => {
          setEmailStates((prev) => {
            const newState = { ...prev }
            delete newState[emailKey]
            return newState
          })
        }, 5000)
        return
      }

      console.log("✅ Extorno marcado como rechazado correctamente")

      // Enviar email de notificación de rechazo
      try {
        console.log("📧 Enviando email de notificación de rechazo...")

        const emailResponse = await fetch("/api/extornos/send-notification-with-attachments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            extorno_id: selectedSolicitud.id,
            tipo: "rechazo",
            usuario_registra_email: selectedSolicitud.solicitado_por_email,
            usuario_registra_nombre: selectedSolicitud.solicitado_por_nombre,
            usuario_rechaza_email: currentUser.email,
            usuario_rechaza_nombre: userProfile?.full_name || currentUser.email,
            motivo_rechazo: motivoRechazo,
            // Documents are fetched by the API route from the DB
          }),
        })

        const emailResult = await emailResponse.json()

        if (emailResponse.ok && emailResult.success) {
          console.log("✅ Email de rechazo enviado correctamente")
        } else {
          console.error("⚠️ Error enviando email de rechazo (pero extorno ya rechazado):", emailResult)
        }
      } catch (emailError) {
        console.error("⚠️ Error crítico enviando email de rechazo (pero extorno ya rechazado):", emailError)
      }

      // Actualizar UI y mostrar mensaje de éxito
      setRejectionMessage(
        `Extorno ${selectedSolicitud.matricula} rechazado por ${userProfile?.full_name || currentUser.email}`,
      )
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => {
        setRejectionMessage("")
      }, 5000)
      toast({
        title: "Extorno rechazado",
        description: "El extorno ha sido rechazado correctamente.",
      })
      setEmailStates((prev) => ({ ...prev, [emailKey]: "success" }))
      // Recargar solicitudes para actualizar la lista
      cargarSolicitudes()
      // Cerrar diálogo y limpiar
      setIsRejectDialogOpen(false)
      setMotivoRechazo("")
      setSelectedSolicitud(null)
      // Limpiar estado después de 3 segundos
      setTimeout(() => {
        setEmailStates((prev) => {
          const newState = { ...prev }
          delete newState[emailKey]
          return newState
        })
      }, 3000)
    } catch (error) {
      console.error("❌ Error crítico rechazando extorno:", error)
      setEmailStates((prev) => ({ ...prev, [emailKey]: "error" }))
      toast({
        title: "Error crítico",
        description: "Error inesperado al rechazar el extorno.",
        variant: "destructive",
      })
      // Limpiar estado después de 5 segundos
      setTimeout(() => {
        setEmailStates((prev) => {
          const newState = { ...prev }
          delete newState[emailKey]
          return newState
        })
      }, 5000)
    }
  }

  const copiarDatos = (solicitud: ExtornoSolicitud) => {
    const texto = `
SOLICITUD DE EXTORNO
Matrícula: ${solicitud.matricula}
Cliente: ${solicitud.cliente}
Número Cliente: ${solicitud.numero_cliente || "N/A"}
Concepto: ${solicitud.concepto}
Importe: ${formatearImporteEspanol(solicitud.importe)}
Número de Cuenta: ${solicitud.numero_cuenta}
Concesión: ${solicitud.concesion === 1 ? "Motor Múnich SA" : "Motor Múnich Cadí"}
Fecha: ${formatearFechaEspanol(solicitud.fecha_solicitud)}
Solicitado por: ${solicitud.solicitado_por_nombre || solicitud.solicitado_por_email || "Desconocido"}
Estado: ${solicitud.estado.toUpperCase()}
${solicitud.estado === "rechazado" ? `Motivo rechazo: ${solicitud.motivo_rechazo || "Sin especificar"}` : ""}
    `.trim()
    navigator.clipboard.writeText(texto)
    // Marcar como copiado
    setCopiedItems((prev) => new Set(prev).add(solicitud.id.toString()))
    // Quitar el estado después de 2 segundos
    setTimeout(() => {
      setCopiedItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(solicitud.id.toString())
        return newSet
      })
    }, 2000)
    toast({
      title: "Datos copiados",
      description: "Los datos han sido copiados al portapapeles.",
    })
  }

  const enviarPorCorreo = (solicitud: ExtornoSolicitud) => {
    const asunto = `EXTORNO (${solicitud.matricula}) (${solicitud.concepto}) (${solicitud.numero_cliente || "N/A"})`
    const cuerpo = `Hola
Matrícula: ${solicitud.matricula}
Cliente: ${solicitud.cliente}
Número Cliente: ${solicitud.numero_cliente || "N/A"}
Concepto: ${solicitud.concepto}
Importe: ${formatearImporteEspanol(solicitud.importe)}
Número de Cuenta: ${solicitud.numero_cuenta}
Concesión: ${solicitud.concesion === 1 ? "Motor Múnich SA" : "Motor Múnich Cadí"}
Solicitado por: ${solicitud.solicitado_por_nombre || solicitud.solicitado_por_email || "Desconocido"}
Estado: ${solicitud.estado.toUpperCase()}
${solicitud.estado === "rechazado" ? `Motivo rechazo: ${solicitud.motivo_rechazo || "Sin especificar"}` : ""}
Muchas gracias`.trim()
    const mailtoLink = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
    window.open(mailtoLink)
    toast({
      title: "Email preparado",
      description: "Se ha abierto el cliente de correo.",
    })
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Circle className="h-4 w-4 text-orange-500" />
      case "tramitado":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "realizado":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rechazado":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-500" />
    }
  }

  const getEmailButtonIcon = (solicitud: ExtornoSolicitud) => {
    const emailKey = `tramitacion_${solicitud.id}`
    const state = emailStates[emailKey] || "idle"
    switch (state) {
      case "sending":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "success":
        return <Send className="h-4 w-4 text-green-600" />
      case "error":
        return <Send className="h-4 w-4 text-red-600" />
      default:
        return <Send className="h-4 w-4 text-blue-600" />
    }
  }

  const getRejectButtonIcon = (solicitud: ExtornoSolicitud) => {
    const emailKey = `rechazo_${solicitud.id}`
    const state = emailStates[emailKey] || "idle"
    switch (state) {
      case "sending":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "success":
        return <Trash className="h-4 w-4 text-green-600" />
      case "error":
        return <Trash className="h-4 w-4 text-red-600" />
      default:
        return <Trash className="h-4 w-4 text-red-600" />
    }
  }

  const filtrarSolicitudes = (estado?: string) => {
    if (!estado) return solicitudes
    return solicitudes.filter((s) => s.estado === estado)
  }

  const contarPorEstado = (estado: string) => {
    return solicitudes.filter((s) => s.estado === estado).length
  }

  // Formatear importe mientras se escribe
  const handleImporteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    // Permitir solo números, puntos, comas y símbolo de euro
    const valorLimpio = valor.replace(/[^0-9.,€\s]/g, "")
    setFormData((prev) => ({ ...prev, importe: valorLimpio }))
  }

  const verDetalles = (solicitud: ExtornoSolicitud, tab?: string) => {
    setSelectedSolicitud(solicitud)
    setIsDetailDialogOpen(true)
    // Resetear estados de la pestaña "Realizado"
    setJustificanteFile(null)
    setPaymentMessage("")
    setIsConfirmingPayment(false)
    // Establecer pestaña por defecto
    setDefaultTab(tab || "adjuntos")
  }

  // Función para manejar el cambio de justificante
  const handleJustificanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setJustificanteFile(file)
      setPaymentMessage("")
    }
  }

  // Función para confirmar pago con justificante
  const handleConfirmarPago = async () => {
    if (!selectedSolicitud) return

    setIsConfirmingPayment(true)
    setPaymentMessage("")

    try {
      const formData = new FormData()
      formData.append("extornoId", selectedSolicitud.id.toString())
      
      // El justificante es opcional
      if (justificanteFile) {
        formData.append("justificante", justificanteFile)
      }

      const response = await fetch("/api/extornos/confirm-payment-with-justificante", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setPaymentMessage("✅ Pago confirmado exitosamente. Se ha enviado un email a todos los implicados.")
        // Recargar datos para actualizar el estado
        await cargarSolicitudes()
        // Cerrar el modal después de un momento
        setTimeout(() => {
          setIsDetailDialogOpen(false)
          setJustificanteFile(null)
          setPaymentMessage("")
          setIsConfirmingPayment(false)
        }, 2000)
      } else {
        setPaymentMessage(`❌ Error: ${result.error || "Error al confirmar el pago"}`)
      }
    } catch (error) {
      console.error("Error confirmando pago:", error)
      setPaymentMessage("❌ Error de conexión al confirmar el pago")
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  // Función para verificar si el usuario puede realizar pagos
  const canPerformPayment = (solicitud: ExtornoSolicitud) => {
    if (!userProfile) return false
    
    const userRole = userProfile.role
    const isAdmin = userRole === "admin"
    const isTramitador = userRole === "tramitador"
    const isPagador = userRole === "pagador"
    
    return isAdmin || isTramitador || isPagador
  }

  // Si no está autenticado, no mostramos nada
  if (isAuthenticated === false) {
    return (
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <span className="ml-2 text-lg">Debe iniciar sesión para acceder a esta página.</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <BMWMSpinner size="sm" />
          <span className="text-lg">Cargando solicitudes...</span>
          {debugInfo && <div className="text-sm text-muted-foreground bg-muted p-2 rounded">Debug: {debugInfo}</div>}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <span className="ml-2 text-lg">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Extornos</h1>
            <p className="text-muted-foreground">Gestión de solicitudes de extorno, devoluciones y transferencias</p>
            {debugInfo && (
              <p className="text-xs text-muted-foreground mt-1">
                <Database className="h-3 w-3 inline mr-1" />
                {debugInfo}
              </p>
            )}
            {rejectionMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">{rejectionMessage}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={cargarSolicitudes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={abrirModalNuevoExtorno}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                  Nueva Solicitud de Extorno
                </DialogTitle>
                <DialogDescription>Complete los datos para crear una nueva solicitud de extorno</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campo de solicitante (no editable) */}
                <div className="space-y-2">
                  <Label htmlFor="solicitante" className="flex items-center gap-2 text-sm font-medium">
                    <UserCircle className="h-4 w-4" />
                    Solicitante
                  </Label>
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/30">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {currentUser?.user_metadata?.full_name ||
                        userProfile?.full_name ||
                        currentUser?.email ||
                        "Usuario actual"}
                    </span>
                  </div>
                </div>
                {/* Primera fila */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="matricula" className="flex items-center gap-2 text-sm font-medium">
                      <Car className="h-4 w-4" />
                      Matrícula *
                    </Label>
                    <Input
                      id="matricula"
                      ref={matriculaRef}
                      value={formData.matricula}
                      onChange={(e) => setFormData((prev) => ({ ...prev, matricula: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, clienteRef)}
                      placeholder="1234ABC"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente" className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      Cliente *
                    </Label>
                    <Input
                      id="cliente"
                      ref={clienteRef}
                      value={formData.cliente}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cliente: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, numeroClienteRef)}
                      placeholder="Nombre completo del cliente"
                      className="h-10"
                      required
                    />
                  </div>
                </div>
                {/* Segunda fila */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="numero_cliente" className="text-sm font-medium">
                      Número de Cliente
                    </Label>
                    <Input
                      id="numero_cliente"
                      ref={numeroClienteRef}
                      value={formData.numero_cliente}
                      onChange={(e) => setFormData((prev) => ({ ...prev, numero_cliente: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, importeRef)}
                      placeholder="CLI001 (opcional)"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="importe" className="flex items-center gap-2 text-sm font-medium">
                      <Euro className="h-4 w-4" />
                      Importe *
                    </Label>
                    <Input
                      id="importe"
                      ref={importeRef}
                      value={formData.importe}
                      onChange={handleImporteChange}
                      onKeyPress={(e) => handleKeyPress(e, conceptoRef)}
                      placeholder="1.250,57€"
                      className="h-10"
                      required
                    />
                  </div>
                </div>
                {/* Tercera fila */}
                <div className="space-y-2">
                  <Label htmlFor="concepto" className="text-sm font-medium">
                    Concepto *
                  </Label>
                  <Textarea
                    id="concepto"
                    ref={conceptoRef}
                    value={formData.concepto}
                    onChange={(e) => setFormData((prev) => ({ ...prev, concepto: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, numeroCuentaRef)}
                    placeholder="Descripción detallada del concepto del extorno"
                    className="min-h-[80px] resize-none"
                    required
                  />
                </div>
                {/* Cuarta fila */}
                <div className="space-y-2">
                  <Label htmlFor="numero_cuenta" className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4" />
                    Número de Cuenta *
                  </Label>
                  <Input
                    id="numero_cuenta"
                    ref={numeroCuentaRef}
                    value={formData.numero_cuenta}
                    onChange={(e) => {
                      const formateado = formatearNumeroCuenta(e.target.value)
                      setFormData((prev) => ({ ...prev, numero_cuenta: formateado }))
                      
                      // Validar y mostrar error
                      const validacion = validarNumeroCuenta(formateado)
                      setNumeroCuentaError(validacion.mensaje)
                    }}
                    onKeyPress={(e) => handleKeyPress(e, concesionRef)}
                    placeholder="ES12 3456 7890 1234 5678 9012"
                    className={`h-10 ${numeroCuentaError ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                  />
                  {numeroCuentaError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {numeroCuentaError}
                    </p>
                  )}
                </div>
                {/* Quinta fila */}
                <div className="space-y-2">
                  <Label htmlFor="concesion" className="flex items-center gap-2 text-sm font-medium">
                    <Building className="h-4 w-4" />
                    Concesión *
                  </Label>
                  <Select
                    value={formData.concesion}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, concesion: value }))}
                    required
                  >
                    <SelectTrigger className="h-10" ref={concesionRef}>
                      <SelectValue placeholder="Seleccionar concesión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1.- Motor Múnich SA</SelectItem>
                      <SelectItem value="2">2.- Motor Múnich Cadí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 🔥 SECCIÓN DE DOCUMENTOS COMPACTA */}
                {extornoTemporal && (
                  <div className="space-y-2">
                    <Label>Documentos Adjuntos</Label>
                    <DocumentUploaderCompact
                      extornoId={extornoTemporal} // This is the temporary string ID
                      tipo="adjunto"
                      documentos={pendingFiles} // Pass pending files for display
                      onFilesSelected={setPendingFiles} // Update pending files state
                      disabled={submitting}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear Solicitud"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabla con pestañas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Solicitudes de Extorno
          </CardTitle>
          <CardDescription>
            Gestione todas las solicitudes de extorno organizadas por estado
            {solicitudes.length > 0 && ` (${solicitudes.length} registros)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pendientes" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pendientes" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Pendientes
                <Badge variant="secondary" className="ml-1">
                  {contarPorEstado("pendiente")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="tramitados" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tramitados
                <Badge variant="secondary" className="ml-1">
                  {contarPorEstado("tramitado")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="realizados" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Realizados
                <Badge variant="secondary" className="ml-1">
                  {contarPorEstado("realizado")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rechazados" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rechazados
                <Badge variant="secondary" className="ml-1">
                  {contarPorEstado("rechazado")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="total" className="flex items-center gap-2">
                <Circle className="h-4 w-4" />
                Total
                <Badge variant="secondary" className="ml-1">
                  {solicitudes.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            {["pendientes", "tramitados", "realizados", "rechazados", "total"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ESTADO</TableHead><TableHead>MATRÍCULA</TableHead><TableHead>CLIENTE</TableHead><TableHead>CONCEPTO</TableHead><TableHead className="text-right">IMPORTE</TableHead><TableHead>SOLICITANTE</TableHead><TableHead>FECHA</TableHead><TableHead>DOCUMENTOS</TableHead><TableHead>ACCIONES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtrarSolicitudes(tab === "total" ? undefined : tab.slice(0, -1)).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No hay solicitudes de extorno en esta categoría
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtrarSolicitudes(tab === "total" ? undefined : tab.slice(0, -1)).map((solicitud) => (
                          <TableRow
                            key={solicitud.id}
                            className="cursor-pointer"
                            onClick={() => verDetalles(solicitud, "adjuntos")}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getEstadoIcon(solicitud.estado)}
                                <span className="capitalize">{solicitud.estado}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{solicitud.matricula}</TableCell>
                            <TableCell>{solicitud.cliente}</TableCell>
                            <TableCell className="max-w-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate block">{solicitud.concepto}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{solicitud.concepto}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="font-medium text-right">
                              {formatearImporteEspanol(solicitud.importe)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <UserCircle className="h-4 w-4 text-muted-foreground" />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate max-w-[120px] block">
                                        {solicitud.solicitado_por_nombre ||
                                          solicitud.solicitado_por_email ||
                                          "Desconocido"}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {solicitud.solicitado_por_nombre ||
                                          solicitud.solicitado_por_email ||
                                          "Desconocido"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatearFechaEspanol(solicitud.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {(solicitud.documentos_adjuntos?.length || 0) +
                                    (solicitud.documentos_tramitacion?.length || 0)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          verDetalles(solicitud, "adjuntos")
                                        }}
                                        className="h-8 w-8 p-0 hover:bg-blue-50"
                                      >
                                        <Eye className="h-4 w-4 text-gray-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Ver detalles</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copiarDatos(solicitud)}
                                        className={
                                          copiedItems.has(solicitud.id.toString()) ? "bg-green-100 border-green-300 h-8 w-8 p-0" : "h-8 w-8 p-0"
                                        }
                                      >
                                        {copiedItems.has(solicitud.id.toString()) ? (
                                          <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copiar datos</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {solicitud.estado === "pendiente" && (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => enviarEmailTramitacion(solicitud)}
                                            disabled={emailStates[`tramitacion_${solicitud.id}`] === "sending"}
                                            className="h-8 w-8 p-0"
                                          >
                                            {getEmailButtonIcon(solicitud)}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Enviar email de tramitación</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => rechazarExtorno(solicitud)}
                                            disabled={emailStates[`rechazo_${solicitud.id}`] === "sending"}
                                            className="border-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                          >
                                            {getRejectButtonIcon(solicitud)}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Rechazar extorno</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </>
                                )}
                                {(solicitud.estado === "tramitado" || solicitud.estado === "realizado") && canPerformPayment(solicitud) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            verDetalles(solicitud, "realizado")
                                          }}
                                          className="border-green-500 hover:bg-green-50 h-8 w-8 p-0"
                                        >
                                          <CreditCardIcon className="h-4 w-4 text-green-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Confirmar pago / Ver realizado</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogo de rechazo */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-600" />
              Rechazar Extorno
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea rechazar el extorno {selectedSolicitud?.matricula}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo_rechazo" className="text-sm font-medium">
                Motivo del rechazo (opcional)
              </Label>
              <Textarea
                id="motivo_rechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Especifique el motivo del rechazo..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmarRechazo}>
              <Trash className="h-4 w-4 mr-2" />
              Rechazar Extorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de detalles */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              Detalles de Solicitud de Extorno
            </DialogTitle>
            <DialogDescription>Visualice los detalles completos de la solicitud de extorno</DialogDescription>
          </DialogHeader>
          {selectedSolicitud && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">MATRÍCULA</Label>
                  <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono">
                    {selectedSolicitud.matricula}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">CLIENTE</Label>
                  <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm">
                    {selectedSolicitud.cliente}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">NÚMERO CLIENTE</Label>
                  <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono">
                    {selectedSolicitud.numero_cliente || "N/A"}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">IMPORTE</Label>
                  <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono font-bold">
                    {formatearImporteEspanol(selectedSolicitud.importe)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500 uppercase">CONCEPTO</Label>
                <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm whitespace-pre-line">
                  {selectedSolicitud.concepto}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500 uppercase">NÚMERO DE CUENTA</Label>
                <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono">
                  {selectedSolicitud.numero_cuenta}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">CONCESIÓN</Label>
                  <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm">
                    {selectedSolicitud.concesion === 1 ? "Motor Múnich SA" : "Motor Múnich Cadí"}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">ESTADO</Label>
                  <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono">
                    {selectedSolicitud.estado.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">FECHA SOLICITUD</Label>
                  <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono">
                    {formatearFechaEspanol(selectedSolicitud.created_at)}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">SOLICITADO POR</Label>
                  <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm">
                    {selectedSolicitud.solicitado_por_nombre || selectedSolicitud.solicitado_por_email || "Desconocido"}
                  </div>
                </div>
              </div>
              {(selectedSolicitud.fecha_tramitacion ||
                selectedSolicitud.fecha_realizacion ||
                selectedSolicitud.fecha_rechazo) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedSolicitud.fecha_tramitacion && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500 uppercase">FECHA TRAMITACIÓN</Label>
                      <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono">
                        {formatearFechaEspanol(selectedSolicitud.fecha_tramitacion)}
                      </div>
                    </div>
                  )}
                  {selectedSolicitud.fecha_realizacion && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500 uppercase">FECHA REALIZACIÓN</Label>
                      <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono">
                        {formatearFechaEspanol(selectedSolicitud.fecha_realizacion)}
                      </div>
                    </div>
                  )}
                  {selectedSolicitud.fecha_rechazo && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500 uppercase">FECHA RECHAZO</Label>
                      <div className="mt-1 px-3 py-2 bg-black text-white rounded-md text-sm font-mono">
                        {formatearFechaEspanol(selectedSolicitud.fecha_rechazo)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {selectedSolicitud.motivo_rechazo && (
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase">MOTIVO RECHAZO</Label>
                  <div className="mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                    {selectedSolicitud.motivo_rechazo}
                  </div>
                </div>
              )}

              {/* 🔥 DOCUMENTOS ADJUNTOS COMPACTOS */}
              {selectedSolicitud.id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documentos Adjuntos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={defaultTab}>
                      <TabsList>
                        <TabsTrigger value="adjuntos">
                          Adjuntos ({selectedSolicitud.documentos_adjuntos?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="tramitacion">
                          Tramitación ({selectedSolicitud.documentos_tramitacion?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="realizado">
                          Realizado
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="adjuntos">
                        <DocumentUploaderCompact
                          extornoId={selectedSolicitud.id}
                          tipo="adjunto"
                          documentos={selectedSolicitud.documentos_adjuntos || []}
                          onDocumentUploaded={() => cargarSolicitudes()}
                          onDocumentRemoved={() => cargarSolicitudes()}
                          disabled={false}
                        />
                      </TabsContent>

                      <TabsContent value="tramitacion">
                        <DocumentUploaderCompact
                          extornoId={selectedSolicitud.id}
                          tipo="tramitacion"
                          documentos={selectedSolicitud.documentos_tramitacion || []}
                          onDocumentUploaded={() => cargarSolicitudes()}
                          onDocumentRemoved={() => cargarSolicitudes()}
                          disabled={false}
                        />
                      </TabsContent>

                      <TabsContent value="realizado">
                        <div className="space-y-4">
                          {/* Mostrar justificante existente si existe */}
                          {selectedSolicitud.justificante_url && (
                            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h4 className="font-medium text-green-800">Justificante de Pago</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700">
                                  {selectedSolicitud.justificante_nombre || "Justificante"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(selectedSolicitud.justificante_url, '_blank')}
                                  className="ml-auto"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Formulario para adjuntar justificante y realizar pago */}
                          {selectedSolicitud.estado === "tramitado" && canPerformPayment(selectedSolicitud) && (
                            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <CreditCardIcon className="h-5 w-5 text-blue-600" />
                                <h4 className="font-medium text-blue-800">Confirmar Pago</h4>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="justificante" className="text-sm font-medium text-blue-700">
                                    Adjuntar Justificante (opcional)
                                  </Label>
                                  <Input
                                    id="justificante"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={handleJustificanteChange}
                                    className="mt-1"
                                  />
                                  <p className="text-xs text-blue-600 mt-1">
                                    Puede confirmar el pago sin adjuntar justificante
                                  </p>
                                </div>

                                {paymentMessage && (
                                  <div className={`p-3 rounded-md text-sm ${
                                    paymentMessage.includes("✅") 
                                      ? "bg-green-100 text-green-800 border border-green-200" 
                                      : "bg-red-100 text-red-800 border border-red-200"
                                  }`}>
                                    {paymentMessage}
                                  </div>
                                )}

                                <Button
                                  onClick={handleConfirmarPago}
                                  disabled={isConfirmingPayment}
                                  className="w-full"
                                >
                                  {isConfirmingPayment ? (
                                    <>
                                      <BMWMSpinner size="sm" className="mr-2" />
                                      Confirmando...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Confirmar Pago
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Mensaje si no puede realizar pagos */}
                          {selectedSolicitud.estado === "tramitado" && !canPerformPayment(selectedSolicitud) && (
                            <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-gray-600" />
                                <span className="text-sm text-gray-700">
                                  Solo tramitadores, pagadores y administradores pueden confirmar pagos
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Mensaje si ya está realizado */}
                          {selectedSolicitud.estado === "realizado" && !selectedSolicitud.justificante_url && (
                            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm text-green-700">
                                  Pago confirmado sin justificante
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDetailDialogOpen(false)}>
              Cerrar
            </Button>
            {selectedSolicitud && (
              <>
                <Button type="button" variant="secondary" size="sm" onClick={() => copiarDatos(selectedSolicitud)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Datos
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
