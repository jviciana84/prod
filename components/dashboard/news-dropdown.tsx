"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface NewsItem {
  id: string
  titulo: string
  resumen: string | null
  imagen_url: string | null
  url_original: string
  marca: "BMW" | "MINI" | "Motorrad" | "Quadis"
  categoria: "economica" | "competicion" | "general"
  fuente: string | null
  fecha_publicacion: string | null
  nueva: boolean
  created_at: string
}

interface NewsDropdownProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLElement>
}

export function NewsDropdown({ isOpen, onClose, triggerRef }: NewsDropdownProps) {
  const [noticias, setNoticias] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchNoticias()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose, triggerRef])

  const fetchNoticias = async () => {
    try {
      console.log("📰 [NewsDropdown] Iniciando carga de noticias desde API...")
      setLoading(true)
      const response = await fetch("/api/noticias/list?limit=5")
      
      if (!response.ok) {
        throw new Error("Error al cargar noticias")
      }
      
      const { data } = await response.json()
      console.log("✅ [NewsDropdown] Noticias cargadas:", data?.length || 0)
      setNoticias(data || [])
    } catch (error) {
      console.error("❌ [NewsDropdown] Excepción al cargar noticias:", error)
    } finally {
      console.log("🏁 [NewsDropdown] Finalizando carga")
      setLoading(false)
    }
  }

  const getMarcaColor = (marca: string) => {
    switch (marca) {
      case "BMW":
        return "bg-blue-500"
      case "MINI":
        return "bg-green-500"
      case "Motorrad":
        return "bg-orange-500"
      case "Quadis":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return null
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return null
    }
  }

  const handleNewsClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleGoToPage = () => {
    router.push("/dashboard/noticias")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 rounded-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-2xl border-0 animate-in fade-in-0 zoom-in-95 z-[60]"
      style={{ top: "100%" }}
    >
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Cargando noticias...</div>
        ) : noticias.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No hay noticias disponibles</div>
        ) : (
          <>
            {/* Card especial para ir a la página - PRIMERO */}
            <div
              className={cn(
                "cursor-pointer transition-all duration-300",
                "animate-in slide-in-from-top-2 fade-in-0",
                "bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-primary/30 rounded-lg",
                "hover:bg-white/15 dark:hover:bg-white/10 hover:border-primary/50 hover:shadow-lg"
              )}
              style={{
                animationDelay: "0ms",
                animationFillMode: "backwards",
              }}
              onClick={handleGoToPage}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Ir a página de Noticias</p>
                    <p className="text-xs text-muted-foreground">Quadis Munich</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

            {/* Noticias */}
            {noticias.map((noticia, index) => (
              <div
                key={noticia.id}
                className={cn(
                  "cursor-pointer transition-all duration-300",
                  "animate-in slide-in-from-top-2 fade-in-0",
                  "bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg",
                  "hover:bg-white/15 dark:hover:bg-white/10 hover:shadow-lg"
                )}
                style={{
                  animationDelay: `${(index + 1) * 100}ms`,
                  animationFillMode: "backwards",
                }}
                onClick={() => handleNewsClick(noticia.url_original)}
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {noticia.imagen_url && (
                      <div className="relative w-20 h-16 rounded overflow-hidden flex-shrink-0 bg-black/20">
                        <Image
                          src={noticia.imagen_url}
                          alt={noticia.titulo}
                          fill
                          className="object-cover"
                          sizes="80px"
                          onError={(e) => {
                            const target = e.target as HTMLElement
                            target.style.display = "none"
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Badge className={cn("text-white text-xs h-5", getMarcaColor(noticia.marca))}>
                          {noticia.marca}
                        </Badge>
                        {noticia.nueva && (
                          <Badge className="bg-red-500 text-white text-xs h-5">Nueva</Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2 leading-tight font-medium">
                        {noticia.titulo}
                      </p>
                      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        {noticia.fecha_publicacion && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatFecha(noticia.fecha_publicacion)}
                          </div>
                        )}
                        {noticia.fuente && (
                          <div className="italic opacity-80">Fuente: {noticia.fuente}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}


