"use client"
import { Moon, Sun, Sunset } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"

export function ThemeToggle() {
  const themeContext = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Protección mientras se monta
  if (!themeContext) {
    return null
  }
  
  const { setTheme, theme } = themeContext

  // Manejar eventos de clic fuera del menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Verificar si el clic fue fuera del menú de tema
      const isOutsideThemeMenu = 
        menuRef.current && 
        !menuRef.current.contains(target) &&
        buttonRef.current && 
        !buttonRef.current.contains(target)
      
      // Cerrar menú si se hace clic fuera
      if (isOutsideThemeMenu) {
        setIsOpen(false)
      }
    }

    // Manejar tecla Escape
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    // Solo agregar los listeners si el menú está abierto
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscapeKey)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscapeKey)
      }
    }
  }, [isOpen])

  // Determina el icono a mostrar según el tema activo
  const getIcon = () => {
    if (!mounted) return null // Evita el error de hidratación
    if (theme === "dark") return <Moon className="h-5 w-5" />
    if (theme === "ocre") return <Sunset className="h-5 w-5" />
    return <Sun className="h-5 w-5" />
  }

  return (
    <div className="relative">
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative"
      >
        {getIcon()}
        <span className="sr-only">Cambiar tema</span>
      </Button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute right-1/2 translate-x-1/2 mt-2 flex flex-col gap-1 p-1 rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 z-[60]"
        >
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
