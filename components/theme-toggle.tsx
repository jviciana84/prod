"use client"
import { Moon, Sun, Sunset } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determina el icono a mostrar según el tema activo
  const getIcon = () => {
    if (!mounted) return null // Evita el error de hidratación
    if (theme === "dark") return <Moon className="h-5 w-5" />
    if (theme === "ocre") return <Sunset className="h-5 w-5" />
    return <Sun className="h-5 w-5" />
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        {getIcon()}
        <span className="sr-only">Cambiar tema</span>
      </Button>

      {isOpen && (
        <div className="absolute right-1/2 translate-x-1/2 mt-2 flex flex-col gap-1 p-1 rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTheme("light")
              setIsOpen(false)
            }}
            className={`${theme === "light" ? "bg-accent" : ""}`}
          >
            <Sun className="h-5 w-5" />
            <span className="sr-only">Tema claro</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTheme("ocre")
              setIsOpen(false)
            }}
            className={`${theme === "ocre" ? "bg-accent" : ""}`}
          >
            <Sunset className="h-5 w-5" />
            <span className="sr-only">Tema ocre</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTheme("dark")
              setIsOpen(false)
            }}
            className={`${theme === "dark" ? "bg-accent" : ""}`}
          >
            <Moon className="h-5 w-5" />
            <span className="sr-only">Tema oscuro</span>
          </Button>
        </div>
      )}
    </div>
  )
}
