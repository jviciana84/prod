"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, Calendar, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"

interface NewsItem {
  id: string
  titulo: string
  resumen: string | null
  imagen_url: string | null
  url_original: string
  marca: "BMW" | "MINI" | "Motorrad"
  categoria: "economica" | "competicion" | "general"
  fuente: string | null
  fecha_publicacion: string | null
  nueva: boolean
  created_at: string
}

type MarcaFilter = "todas" | "BMW" | "MINI" | "Motorrad" | "Quadis"
type CategoriaFilter = "todas" | "economica" | "competicion" | "general"

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [marcaFilter, setMarcaFilter] = useState<MarcaFilter>("todas")
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaFilter>("todas")

  useEffect(() => {
    fetchNoticias()
  }, [])

  const fetchNoticias = async () => {
    try {
      setLoading(true)
      console.log("📰 Cargando noticias desde API...")
      const response = await fetch("/api/noticias/list")
      
      if (!response.ok) {
        throw new Error("Error al cargar noticias")
      }
      
      const { data } = await response.json()
      setNoticias(data || [])
      console.log("✅ Noticias cargadas:", data?.length || 0)
    } catch (error) {
      console.error("Error al cargar noticias:", error)
      toast.error("Error al cargar las noticias")
    } finally {
      setLoading(false)
    }
  }

  const filteredNoticias = noticias.filter((noticia) => {
    // Filtro de búsqueda
    const matchesSearch =
      searchQuery === "" ||
      noticia.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      noticia.resumen?.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtro de marca
    const matchesMarca = marcaFilter === "todas" || noticia.marca === marcaFilter

    // Filtro de categoría
    const matchesCategoria = categoriaFilter === "todas" || noticia.categoria === categoriaFilter

    return matchesSearch && matchesMarca && matchesCategoria
  })

  const getMarcaColor = (marca: string) => {
    switch (marca) {
      case "BMW":
        return "bg-blue-500 hover:bg-blue-600"
      case "MINI":
        return "bg-green-500 hover:bg-green-600"
      case "Motorrad":
        return "bg-orange-500 hover:bg-orange-600"
      case "Quadis":
        return "bg-purple-500 hover:bg-purple-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case "economica":
        return "Económica"
      case "competicion":
        return "Competición"
      case "general":
        return "General"
      default:
        return categoria
    }
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return null
    try {
      return new Date(fecha).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return null
    }
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      {/* Header con breadcrumbs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs 
            className="mt-4"
            segments={[
              {
                title: "Dashboard",
                href: "/dashboard",
              },
              {
                title: "Noticias Quadis",
                href: "/dashboard/noticias",
              },
            ]}
          />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <div className="flex items-center gap-3">
          <Newspaper className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Noticias Quadis Munich</h1>
            <p className="text-muted-foreground">Últimas noticias de BMW, MINI, BMW Motorrad y Quadis</p>
          </div>
        </div>
      </div>

      {/* Filtros compactos */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Buscador - 33% */}
            <div className="relative">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar noticias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por marca - 33% */}
            <div>
              <label className="text-sm font-medium mb-2 block">Marca</label>
              <div className="flex flex-wrap gap-1.5">
                {(["todas", "BMW", "MINI", "Motorrad", "Quadis"] as MarcaFilter[]).map((marca) => (
                  <Button
                    key={marca}
                    variant={marcaFilter === marca ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMarcaFilter(marca)}
                    className={cn(
                      "text-xs px-2 h-8",
                      marcaFilter === marca && marca !== "todas" && getMarcaColor(marca),
                      "transition-colors"
                    )}
                  >
                    {marca === "todas" ? "Todas" : marca}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filtro por categoría - 33% */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de noticia</label>
              <div className="flex flex-wrap gap-1.5">
                {(["todas", "economica", "competicion", "general"] as CategoriaFilter[]).map((cat) => (
                  <Button
                    key={cat}
                    variant={categoriaFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoriaFilter(cat)}
                    className="text-xs px-2 h-8"
                  >
                    {cat === "todas" ? "Todas" : getCategoriaLabel(cat)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contador de resultados */}
      <div className="mb-4 text-sm text-muted-foreground">
        {loading ? "Cargando..." : `${filteredNoticias.length} noticia${filteredNoticias.length !== 1 ? "s" : ""}`}
      </div>

      {/* Grid de noticias */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted" />
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNoticias.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron noticias</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNoticias.map((noticia) => (
            <Card
              key={noticia.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => window.open(noticia.url_original, "_blank", "noopener,noreferrer")}
            >
              {/* Imagen */}
              {noticia.imagen_url && (
                <div className="relative h-48 bg-muted overflow-hidden">
                  <Image
                    src={noticia.imagen_url}
                    alt={noticia.titulo}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      const target = e.target as HTMLElement
                      target.style.display = "none"
                    }}
                  />
                  {noticia.nueva && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-500 hover:bg-red-600">Nueva</Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Contenido */}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={cn("text-white", getMarcaColor(noticia.marca))}>{noticia.marca}</Badge>
                  <Badge variant="outline">{getCategoriaLabel(noticia.categoria)}</Badge>
                </div>
                <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                  {noticia.titulo}
                </CardTitle>
                <div className="space-y-1">
                  {noticia.fecha_publicacion && (
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {formatFecha(noticia.fecha_publicacion)}
                    </CardDescription>
                  )}
                  {noticia.fuente && (
                    <CardDescription className="text-xs italic">
                      Fuente: {noticia.fuente}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>

              {noticia.resumen && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{noticia.resumen}</p>
                </CardContent>
              )}

              {/* Footer */}
              <CardContent className="pt-0">
                <Button variant="ghost" size="sm" className="w-full gap-2 group-hover:bg-accent">
                  Ver noticia completa
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

