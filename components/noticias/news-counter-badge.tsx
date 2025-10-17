"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

/**
 * Badge que muestra el contador de noticias nuevas
 * Opcional para añadir al header
 */
export function NewsCounterBadge() {
  const [newCount, setNewCount] = useState(0)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchNewCount()

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchNewCount, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchNewCount = async () => {
    try {
      const { count, error } = await supabase.from("bmw_noticias").select("*", { count: "exact", head: true }).eq("nueva", true)

      if (error) throw error
      setNewCount(count || 0)
    } catch (error) {
      console.error("Error al obtener contador de noticias:", error)
    }
  }

  const handleClick = async () => {
    // Marcar como leídas al hacer click
    try {
      await fetch("/api/noticias/marcar-leidas", { method: "POST" })
      setNewCount(0)
    } catch (error) {
      console.error("Error al marcar noticias como leídas:", error)
    }

    router.push("/dashboard/noticias")
  }

  if (newCount === 0) return null

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} className="relative">
      <Newspaper className="h-5 w-5" />
      {newCount > 0 && (
        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
          {newCount > 9 ? "9+" : newCount}
        </Badge>
      )}
    </Button>
  )
}

