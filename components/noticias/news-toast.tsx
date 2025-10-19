"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface NewsItem {
  id: string
  titulo: string
  resumen: string | null
  imagen_url: string | null
  url_original: string
  marca: string
}

interface NewsToastProps {
  news: NewsItem
  onClose: () => void
  onNavigate: () => void
}

export function NewsToast({ news, onClose, onNavigate }: NewsToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 100)

    // Auto-hide después de 5 segundos
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleClick = () => {
    window.open(news.url_original, "_blank", "noopener,noreferrer")
    handleClose()
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

  return (
    <div
      className={cn(
        "fixed right-4 top-1/2 -translate-y-1/2 z-50 w-96 max-w-[calc(100vw-2rem)]",
        "bg-card border border-border rounded-lg shadow-2xl overflow-hidden",
        "transform transition-all duration-300 ease-out",
        isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        "cursor-pointer hover:shadow-3xl hover:scale-[1.02]"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {/* Badge de marca */}
      <div className="absolute top-2 left-2 z-10">
        <span className={cn("px-2 py-1 rounded text-xs font-bold text-white", getMarcaColor(news.marca))}>
          {news.marca}
        </span>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
        }}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Imagen */}
      {news.imagen_url && (
        <div className="relative w-full h-32 bg-muted">
          <Image
            src={news.imagen_url}
            alt={news.titulo}
            fill
            className="object-cover"
            sizes="384px"
            onError={(e) => {
              const target = e.target as HTMLElement
              target.style.display = "none"
            }}
          />
        </div>
      )}

      {/* Contenido */}
      <div className="p-3">
        <h3 className="font-bold text-xs mb-1.5 line-clamp-2">{news.titulo}</h3>
        {news.resumen && <p className="text-[11px] text-muted-foreground line-clamp-2">{news.resumen}</p>}
      </div>

      {/* Indicador de progreso */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary animate-progress"
          style={{
            animation: "progress 5s linear forwards",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

// Container para gestionar múltiples toasts
export function NewsToastContainer() {
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null)

  useEffect(() => {
    // Suscribirse a nuevas noticias
    const checkForNewNews = async () => {
      try {
        const response = await fetch("/api/noticias/ultimas-nuevas")
        if (response.ok) {
          const news = await response.json()
          if (news && news.id) {
            setCurrentNews(news)
          }
        }
      } catch (error) {
        console.error("Error al obtener noticias:", error)
      }
    }

    // Verificar cada 30 minutos
    checkForNewNews()
    const interval = setInterval(checkForNewNews, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (!currentNews) return null

  return (
    <NewsToast
      news={currentNews}
      onClose={() => setCurrentNews(null)}
      onNavigate={() => setCurrentNews(null)}
    />
  )
}

