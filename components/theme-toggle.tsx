"use client"
import { Moon, Sun, Sunset } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 ocre:rotate-90 ocre:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 ocre:rotate-90 ocre:scale-0" />
        <Sunset className="absolute h-5 w-5 rotate-90 scale-0 transition-all ocre:rotate-0 ocre:scale-100 dark:rotate-90 dark:scale-0" />
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
