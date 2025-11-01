"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClientComponentClient } from "@/lib/supabase/client"
import { VersionBadge } from "@/components/version-badge"
import { Logo } from "@/components/ui/logo"
// import { clearAllSupabaseCookies } from "@/utils/fix-auth"

// Definir la versión actual de la aplicación
const APP_VERSION = "1.0.0"

// Array de videos disponibles en Supabase Storage
const LOGIN_VIDEOS = [
  "https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/Video_BMW_M_GT_CVO_2.mp4",
  "https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/BMW_M_HYBRID_V.mp4",
  "https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/BMW_M_GT_Carreras.mp4",
  "https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/Video_BMW_M_GT_CVO.mp4"
]

export default function LoginPage() {
  // Seleccionar video aleatorio solo en cliente (null hasta que se monte)
  const [randomVideo, setRandomVideo] = useState<string | null>(null)
  
  // Seleccionar video aleatorio después de la hidratación (solo en cliente)
  useEffect(() => {
    const selectedVideo = LOGIN_VIDEOS[Math.floor(Math.random() * LOGIN_VIDEOS.length)]
    const videoName = selectedVideo.split('/').pop()
    console.log(`🎬 Video de login seleccionado: ${videoName}`)
    setRandomVideo(selectedVideo)
  }, [])
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClientComponentClient()

      console.log("Intentando iniciar sesión con:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Respuesta de autenticación:", { data, error })

      if (error) {
        console.error("Error de autenticación:", error)
        throw error
      }

      // Verificar si el usuario necesita cambiar su contraseña
      const forcePasswordChange = data.user?.user_metadata?.force_password_change
      console.log("Force password change flag:", forcePasswordChange)

      if (forcePasswordChange) {
        toast({
          title: "Cambio de contraseña requerido",
          description: "Debes cambiar tu contraseña antes de continuar...",
        })
        router.push("/force-password-change")
        return
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: "Redirigiendo al dashboard...",
      })

      router.refresh()
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error capturado:", error)

      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Por favor, verifica tus credenciales",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyReset = () => {
            // clearAllSupabaseCookies()
    window.location.href = "/?reset=" + Date.now()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Video de fondo BMW - reproducción única sin audio (aleatorio) */}
      {randomVideo ? (
        <>
          <video
            key={randomVideo}
            autoPlay
            muted
            playsInline
            onEnded={() => setVideoEnded(true)}
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <source src={randomVideo} type="video/mp4" />
          </video>
          <div 
            className={`absolute inset-0 transition-all duration-1000 ${videoEnded ? 'bg-black/55' : 'bg-black/20'}`}
            style={{ zIndex: 1 }} 
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black" style={{ zIndex: 0 }} />
      )}

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        <Card className={`bg-background/80 transition-all duration-1000 ${videoEnded ? 'backdrop-blur-md' : ''}`}>
          <CardHeader className="space-y-1 text-center pt-4 pb-2">
            <div className="flex justify-center">
              {/* Logo con tamaño extra grande */}
              <div className="w-auto h-[92.5px] flex items-center justify-center">
                <Logo size="xxl" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight mt-0">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a <span className="font-medium">Control Vehículos de Ocasión</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/reset-password" className="text-sm text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center">
            <div className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <a href="mailto:jordi.viciana@munichgroup.es" className="text-primary hover:underline">
                Contacta con el administrador
              </a>
            </div>

            {/* Botón de emergencia debajo */}
            <div className="pt-2 border-t border-border">
              <details className="text-sm text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground transition-colors">
                  ¿Problemas para iniciar sesión?
                </summary>
                <div className="mt-2 p-3 bg-muted/50 rounded-md">
                  <p className="text-xs mb-2">
                    Si tienes problemas para iniciar sesión después de un deploy, puedes intentar limpiar los datos de
                    sesión:
                  </p>
                  <button
                    type="button"
                    onClick={handleEmergencyReset}
                    className="flex items-center justify-center w-full text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Restablecer datos de sesión
                  </button>
                </div>
              </details>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} CVO. Todos los derechos reservados.
              </div>
              <VersionBadge version={APP_VERSION} />
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
