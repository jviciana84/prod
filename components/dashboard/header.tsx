"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import {
  LogOut,
  ZoomIn,
  Briefcase,
  PenSquare,
  Users,
  Star,
  Tag,
  BadgeCheck,
  Crown,
  Settings,
  Heart,
  Bell,
  Menu,
  Trash2,
  ScanLine,
} from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/ui/logo"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { getUserPreferences } from "@/lib/user-preferences"
import type { PageInfo } from "@/types/user-preferences"
import { clearCorruptedSession } from "@/utils/fix-auth"
import { useChat } from "@/contexts/chat-context"

interface DashboardHeaderProps {
  user: User
  roles: string[]
}

interface UserProfile {
  id: string
  phone: string | null
  alias: string | null
  position: string | null
  avatar_url: string | null
  // Otros campos que pueda tener la tabla profiles
}

interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  created_at: string
  read_at: string | null
}

export default function DashboardHeader({ user, roles }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toggleSidebar } = useSidebar()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAvatarZoomed, setIsAvatarZoomed] = useState(false)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mainFavorite, setMainFavorite] = useState<PageInfo | null>(null)
  const [regularFavorites, setRegularFavorites] = useState<PageInfo[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const avatarTriggerRef = useRef<HTMLDivElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const [isReflectionActive, setIsReflectionActive] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const { openChat } = useChat()

  // Obtener el nombre para mostrar (priorizar perfil de la base de datos, luego metadatos, luego email)
  const displayName = userProfile?.full_name || user.user_metadata.full_name || user.email

  // Efecto automático de reflejo cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setIsReflectionActive(true)
      setTimeout(() => {
        setIsReflectionActive(false)
      }, 500) // Duración del efecto
    }, 8000) // Cada 8 segundos

    return () => clearInterval(interval)
  }, [])

  // Manejar clic del botón Edelweiss
  const handleEdelweissClick = () => {
    setIsSearchExpanded(!isSearchExpanded)
    if (!isSearchExpanded) {
      setSearchValue("")
    }
  }

  // Manejar búsqueda (intro o botón)
  const handleSearch = () => {
    if (searchValue.trim()) {
      // Abrir chat con el texto
      openChat()
      // Pasar el texto al chat usando un evento personalizado
      const event = new CustomEvent('chatMessage', { 
        detail: { message: searchValue.trim() } 
      })
      window.dispatchEvent(event)
      setIsSearchExpanded(false)
      setSearchValue("")
    }
  }

  // Manejar historial
  const handleHistory = () => {
    // Abrir chat primero
    openChat()
    // Abrir el historial del chat usando un evento personalizado
    setTimeout(() => {
      const event = new CustomEvent('openChatHistory')
      window.dispatchEvent(event)
    }, 100) // Pequeño delay para asegurar que el chat esté abierto
    setIsSearchExpanded(false)
  }



  // DESACTIVADO: No limpiar cookies automáticamente
  // useEffect(() => {
  //   const fixed = smartFixCorruptedCookies()
  //   if (fixed) {
  //     console.log("Se limpiaron cookies corruptas, pero se mantiene la sesión válida")
  //   }
  // }, [])

  // Cargar el perfil del usuario y sus preferencias
  useEffect(() => {
    async function loadUserData() {
      try {
        setIsLoading(true)

        // Cargar perfil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, phone, alias, position, avatar_url")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error al cargar el perfil del usuario:", profileError)
        } else {
          setUserProfile(profileData)
          setPhoneNumber(profileData.phone || "")
        }

        // Cargar preferencias
        try {
          const preferences = await getUserPreferences(user.id)
          if (preferences) {
            setMainFavorite(preferences.main_page || null)
            setRegularFavorites(preferences.favorite_pages || [])
          } else {
            // Si no hay preferencias, usar valores por defecto
            setMainFavorite(null)
            setRegularFavorites([])
          }
        } catch (prefsError) {
          console.error("Error al cargar preferencias:", prefsError)
          // En caso de error, usar valores por defecto
          setMainFavorite(null)
          setRegularFavorites([])
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [supabase, user.id])

  // Cargar notificaciones reales
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notification_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("Error cargando notificaciones:", error)
          return
        }

        setNotifications(data || [])
        setUnreadNotifications(data?.filter((n) => !n.read_at).length || 0)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoadingNotifications(false)
      }
    }

    if (user?.id) {
      loadNotifications()
    }
  }, [user?.id, supabase])

  // Manejar eventos de clic fuera del menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Verificar si el clic fue fuera del menú de avatar
      const isOutsideAvatarMenu = 
        menuRef.current && 
        !menuRef.current.contains(target) &&
        avatarRef.current && 
        !avatarRef.current.contains(target)
      
      // Verificar si el clic fue fuera del menú de notificaciones
      const isOutsideNotificationsMenu = 
        notificationsRef.current && 
        !notificationsRef.current.contains(target) &&
        !target.closest('[data-notification-trigger]') // Evitar cerrar si se hace clic en el botón de notificaciones
      
      // Cerrar menús si se hace clic fuera
      if (isOutsideAvatarMenu) {
        setIsMenuOpen(false)
      }
      
      if (isOutsideNotificationsMenu) {
        setIsNotificationsOpen(false)
      }
    }

    // Manejar tecla Escape
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setIsNotificationsOpen(false)
      }
    }

    // Solo agregar los listeners si alguno de los menús está abierto
    if (isMenuOpen || isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscapeKey)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscapeKey)
      }
    }
  }, [isMenuOpen, isNotificationsOpen])

  // Prevenir scroll cuando el avatar está ampliado
  useEffect(() => {
    if (isAvatarZoomed) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isAvatarZoomed])

  const handleSignOut = async () => {
    console.log("Cerrando sesión...")

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error al cerrar sesión:", error)
        toast({
          title: "Error",
          description: "No se pudo cerrar la sesión. Inténtelo de nuevo.",
          variant: "destructive",
        })
        return
      }

      console.log("Sesión cerrada exitosamente")

      // Limpiar el estado local
      setIsMenuOpen(false)

      // Forzar recarga de la página para limpiar el estado
      window.location.href = "/"
    } catch (error) {
      console.error("Error capturado al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "Error inesperado al cerrar sesión.",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePhone = async () => {
    if (!userProfile) return

    try {
      // Actualizar el teléfono en la tabla profiles
      const { error } = await supabase.from("profiles").update({ phone: phoneNumber }).eq("id", user.id)

      if (error) {
        console.error("Error al actualizar el teléfono:", error)
        toast({
          title: "Error",
          description: "No se pudo actualizar el teléfono",
          variant: "destructive",
        })
        return
      }

      // Actualizar el estado local
      setUserProfile({
        ...userProfile,
        phone: phoneNumber,
      })

      setIsEditingPhone(false)
      toast({
        title: "Teléfono actualizado",
        description: "El número de teléfono se ha actualizado correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar el teléfono:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el teléfono",
        variant: "destructive",
      })
    }
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUpdatePhone()
    } else if (e.key === "Escape") {
      setIsEditingPhone(false)
      setPhoneNumber(userProfile?.phone || "")
    }
  }

  useEffect(() => {
    if (isEditingPhone) {
      phoneInputRef.current?.focus()

      const handleClickOutside = (event: MouseEvent) => {
        if (phoneInputRef.current && !phoneInputRef.current.contains(event.target as Node)) {
          handleUpdatePhone()
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isEditingPhone])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "administrador":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "supervisor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "logística":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "asesor ventas":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "mecánica":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "carrocería":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
    }
  }

  const marcarTodasComoLeidas = async () => {
    if (unreadNotifications === 0) return

    try {
      const { error } = await supabase
        .from("notification_history")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null)

      if (error) {
        console.error("Error marcando como leídas:", error)
        return
      }

      setUnreadNotifications(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const deleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevenir que se ejecute handleNotificationClick
    
    try {
      const { error } = await supabase
        .from("notification_history")
        .delete()
        .eq("id", notificationId)

      if (error) {
        console.error("Error eliminando notificación:", error)
        toast({
          title: "Error",
          description: "Error eliminando notificación",
          variant: "destructive",
        })
        return
      }

      // Actualizar estado local
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      
      // Recalcular notificaciones sin leer
      const newUnreadCount = notifications.filter(notif => notif.id !== notificationId && !notif.read_at).length
      setUnreadNotifications(newUnreadCount)

      toast({
        title: "Notificación eliminada",
        description: "La notificación se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error eliminando notificación",
        variant: "destructive",
      })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Aquí puedes agregar lógica específica para cada notificación
    console.log("Notificación clickeada:", notification)
    
    // Cerrar el menú de notificaciones
    setIsNotificationsOpen(false)
  }

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Estilos para la animación del eclipse */}
      <style jsx global>{`
        @keyframes eclipseRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        .avatar-eclipse {
          position: relative;
        }
        
        .avatar-eclipse::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0deg, transparent 60deg, var(--ring-color) 120deg, var(--ring-color) 180deg, transparent 240deg, transparent 360deg);
          animation: eclipseRotate 3s linear infinite;
          z-index: -1;
        }
        
        .dark .avatar-eclipse::before {
          --ring-color: rgba(59, 130, 246, 0.6);
        }
        
        .light .avatar-eclipse::before {
          --ring-color: rgba(37, 99, 235, 0.6);
        }
        
        .ocre .avatar-eclipse::before {
          --ring-color: rgba(217, 119, 6, 0.6);
        }
      `}</style>

      <div className="container flex h-14 max-w-full px-4 md:px-6 lg:px-8 xl:px-10 items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Botón del sidebar móvil - solo visible en móvil */}
          <Button 
            className="md:hidden" 
            variant="ghost" 
            size="icon"
            onClick={() => toggleSidebar()}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Logo size="header" linkTo="/dashboard" />
          <div className="hidden md:flex space-x-1">
            {roles.map((role, index) => (
              <Badge key={index} variant="outline" className={`${getRoleBadgeColor(role)}`}>
                {role}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Botón central Edelweiss que se transforma en buscador */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className={`transition-all duration-700 ease-out ${
            isSearchExpanded ? 'w-[34rem]' : 'w-auto'
          }`}>
            {!isSearchExpanded ? (
              <Button
                onClick={handleEdelweissClick}
                variant="ghost"
                className="px-6 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-transparent relative overflow-hidden group hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-700 ease-out"
              >
                <span className="text-sm font-black relative z-10" style={{ fontFamily: 'serif', letterSpacing: '0.2em' }}>
                  EDELWEISS
                </span>
                {/* Efecto de reflejo diagonal */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 -translate-x-full transition-transform duration-500 ease-in-out ${
                  isReflectionActive ? 'translate-x-full' : ''
                } group-hover:translate-x-full`}></div>
              </Button>
            ) : (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full px-2 py-1 flex items-center gap-2 w-full transition-all duration-700 ease-out">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Pregunta a Edelweiss"
                    className="w-full pl-6 pr-8 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                  />
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <svg className="h-3 w-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div 
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer hover:bg-white/10 rounded p-1"
                    title="Buscar (Enter)"
                  >
                    <svg className="h-3 w-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div 
                  onClick={handleHistory}
                  className="flex items-center justify-center cursor-pointer hover:bg-white/10 rounded p-1 border border-white/30"
                  title="Historial"
                >
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div 
                  onClick={handleEdelweissClick}
                  className="flex items-center justify-center cursor-pointer hover:bg-white/10 rounded-full p-1"
                  title="Cerrar"
                >
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {/* Scanner OCR */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-accent"
            onClick={() => {
              if (roles.includes('admin')) {
                // Detectar si es móvil y redirigir a la página móvil
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                  router.push("/dashboard/ocr-scanner/mobile")
                } else {
                  router.push("/dashboard/ocr-scanner")
                }
              } else {
                router.push("/dashboard/ocr-scanner/coming-soon")
              }
            }}
            title="Scanner OCR - Escanear matrículas y texto"
          >
                            <ScanLine className="h-5 w-5" />
          </Button>

          {/* Campana de notificaciones */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-notification-trigger
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-2 right-0 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse relative">
                  <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping"></span>
                  <span className="sr-only">{unreadNotifications} notificaciones sin leer</span>
                </span>
              )}
            </Button>

            {isNotificationsOpen && (
              <div
                ref={notificationsRef}
                className="absolute right-0 mt-2 w-80 rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 z-[60]"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-medium">Notificaciones</h3>
                    {unreadNotifications > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={marcarTodasComoLeidas}>
                        Marcar como leídas
                      </Button>
                    )}
                  </div>
                  <div className="h-px bg-border my-1" />
                  <div className="max-h-[300px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">Cargando notificaciones...</div>
                    ) : notifications.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">No hay notificaciones</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="group relative py-2 px-1 border-b border-border/50 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-sm cursor-pointer transition-colors duration-200"
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.read_at ? "bg-blue-500" : "bg-transparent"}`}
                            />
                            <div className="flex-1">
                              <p className="text-xs font-medium">{notif.title}</p>
                              <p className="text-xs text-muted-foreground">{notif.body}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(notif.created_at).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {/* Icono de basura translúcido que aparece en hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div 
                              className="bg-red-500/20 backdrop-blur-sm rounded p-1 cursor-pointer hover:bg-red-500/30 transition-colors"
                              onClick={(e) => deleteNotification(notif.id, e)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="h-px bg-border my-1" />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs mt-1"
                    onClick={() => router.push("/dashboard/notifications")}
                  >
                    Ver todas las notificaciones
                  </Button>
                </div>
              </div>
            )}
          </div>
          <ThemeToggle />
          <div className="relative ml-2">
            <Button
              ref={avatarRef}
              variant="ghost"
              className="relative h-[48px] w-[48px] rounded-full hover:bg-transparent focus:bg-transparent p-0"
              style={{ marginTop: 5, marginBottom: 5 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="avatar-eclipse">
                <Avatar className="h-[48px] w-[48px]">
                  <AvatarImage 
                    src={userProfile?.avatar_url || "/placeholder.svg"} 
                    alt={displayName}
                  />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              </div>
            </Button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-72 rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 z-[60]"
              >
                <div className="p-3">
                  <div className="flex flex-col items-center pt-1 pb-2 relative">
                    {/* Contenedor para el avatar */}
                    <div className="relative w-20 h-20 mb-2">
                      <div
                        ref={avatarTriggerRef}
                        className="w-20 h-20 rounded-full cursor-pointer group relative"
                        onMouseEnter={() => setIsAvatarZoomed(true)}
                        onMouseLeave={() => setIsAvatarZoomed(false)}
                      >
                        <div className="avatar-eclipse">
                          <Avatar className="h-20 w-20 group-hover:ring-2 group-hover:ring-primary/50 transition-all duration-200">
                            <AvatarImage 
                              src={userProfile?.avatar_url || "/placeholder.svg"} 
                              alt={displayName}
                            />
                            <AvatarFallback className="text-xl">{getInitials(displayName)}</AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Indicador de zoom */}
                        <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="h-3 w-3" />
                        </div>
                      </div>
                    </div>

                    <p className="text-base font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>

                    {/* Teléfono editable desde la tabla users */}
                    <div className="mt-1 flex items-center relative w-full justify-center">
                      {isLoading ? (
                        <span className="text-xs text-muted-foreground">Cargando...</span>
                      ) : isEditingPhone ? (
                        <Input
                          ref={phoneInputRef}
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          onKeyDown={handlePhoneKeyDown}
                          className="h-6 text-xs w-36 text-center"
                          placeholder="Añadir teléfono"
                        />
                      ) : (
                        <div
                          className="flex items-center gap-1 cursor-pointer group"
                          onClick={() => setIsEditingPhone(true)}
                        >
                          <span className="text-xs text-muted-foreground">
                            {userProfile?.phone || "Añadir teléfono"}
                          </span>
                          <PenSquare className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-border my-1.5" />

                  {/* Información de usuario en una línea */}
                  <div className="px-1 py-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Rol */}
                      <div className="flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3 text-blue-500" />
                        <span className="text-xs font-medium">{roles.length > 0 ? roles[0] : "Sin rol"}</span>
                      </div>

                      {/* Separador */}
                      <div className="h-3 w-px bg-border"></div>

                      {/* Cargo */}
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-purple-500" />
                        <span className="text-xs font-medium">
                          {userProfile?.position || user.user_metadata.position || "Sin cargo"}
                        </span>
                      </div>

                      {/* Separador */}
                      <div className="h-3 w-px bg-border"></div>

                      {/* Alias */}
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-green-500" />
                        <span className="text-xs font-medium">{userProfile?.alias || "Sin alias"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Favoritos */}
                  <div className="h-px bg-border my-1.5" />
                  <div className="px-1 py-1.5">
                    {/* Favorito principal */}
                    {mainFavorite ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between text-xs h-8 mb-1.5 group relative overflow-hidden border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30"
                        onClick={() => router.push(mainFavorite.path)}
                      >
                        <div className="flex items-center">
                          <div className="w-5 flex justify-center">
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          </div>
                          <span className="font-medium truncate max-w-[140px]" title={mainFavorite.title}>
                            {mainFavorite.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Principal</span>
                      </Button>
                    ) : (
                      <div className="text-xs text-center text-muted-foreground mb-1.5 py-1">
                        No has seleccionado una página principal
                      </div>
                    )}

                    {/* Grid de 2 columnas para el resto de favoritos */}
                    {regularFavorites.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {regularFavorites.map((page) => (
                          <Button
                            key={page.id}
                            variant="ghost"
                            size="sm"
                            className="justify-start text-xs h-7 group relative overflow-hidden px-2"
                            onClick={() => router.push(page.path)}
                          >
                            <div className="w-5 flex justify-center">
                              <Star className="h-3.5 w-3.5 text-amber-500" />
                            </div>
                            <span className="truncate max-w-[70px]" title={page.title}>
                              {page.title}
                            </span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-center text-muted-foreground py-1">No tienes páginas favoritas</div>
                    )}

                    {/* Botón para gestionar favoritos */}
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => router.push("/dashboard/settings")}
                      >
                        <Heart className="h-3.5 w-3.5 mr-2 text-red-500" />
                        Gestionar favoritos
                      </Button>
                    </div>
                  </div>

                  <div className="h-px bg-border my-1.5" />
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs h-7 relative overflow-hidden group px-2"
                      onClick={() => router.push("/dashboard/directory")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="w-5 flex justify-center">
                        <Users className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <span>Directorio</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs h-7 relative overflow-hidden group px-2"
                      onClick={() => router.push("/dashboard/settings")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="w-5 flex justify-center">
                        <Settings className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <span>Configuración</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs h-7 relative overflow-hidden group px-2"
                      onClick={handleSignOut}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="w-5 flex justify-center">
                        <LogOut className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <span>Cerrar sesión</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar ampliado en el centro de la pantalla */}
      {isAvatarZoomed && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            margin: 0,
            padding: 0,
            pointerEvents: "none", // Permite que los eventos pasen a través
          }}
        >
          <div
            className="relative flex flex-col items-center"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none", // Permite que los eventos pasen a través
            }}
          >
            <div className="avatar-eclipse">
              <Avatar className="h-80 w-80 shadow-xl">
                <AvatarImage
                  src={userProfile?.avatar_url || "/placeholder.svg"}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="text-7xl">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white drop-shadow-md">{displayName}</h2>

            {/* Mostrar el puesto en lugar de los roles */}
            <div className="mt-2 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-background/20 text-white px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                <Briefcase className="h-4 w-4" />
                <span className="text-lg font-medium">
                  {userProfile?.position || user.user_metadata.position || "Sin puesto asignado"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
