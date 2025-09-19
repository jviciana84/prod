"use client"

import React, { useState, useRef, useEffect } from "react"
import { Search, X, Sparkles, Filter, Command } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ModernSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
}

export function ModernSearch({ 
  onSearch, 
  placeholder = "Buscar en todo el sistema...", 
  className 
}: ModernSearchProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Efectos de partículas flotantes
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generar partículas flotantes
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }))
    setParticles(newParticles)
  }, [])

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    setShowSuggestions(false)
    
    // Llamar callback si existe
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch(query)
    } else if (e.key === "Escape") {
      setQuery("")
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const clearSearch = () => {
    setQuery("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Sugerencias de ejemplo
  const suggestions = [
    { label: "1234ABC", category: "Matrícula", icon: "🚗" },
    { label: "BMW Serie 3", category: "Modelo", icon: "🚙" },
    { label: "Juan Pérez", category: "Cliente", icon: "👤" },
    { label: "Ventas pendientes", category: "Estado", icon: "📊" },
    { label: "Entregas hoy", category: "Entregas", icon: "📦" },
  ]

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full",
        className
      )}
    >
      {/* Partículas flotantes de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Contenedor principal del buscador */}
      <motion.div
        className={cn(
          "relative group",
          "bg-background/80 backdrop-blur-xl",
          "border border-border/50",
          "rounded-2xl shadow-2xl",
          "transition-all duration-500 ease-out",
          isFocused && "shadow-blue-500/20 shadow-2xl border-blue-400/50",
          "hover:shadow-xl hover:shadow-blue-500/10"
        )}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Efecto de brillo sutil */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Contenido del buscador */}
        <div className="relative p-1">
          <div className="flex items-center gap-2 px-3 py-2">
            {/* Icono de búsqueda con animación */}
            <motion.div
              className="flex-shrink-0"
              animate={{ 
                rotate: isFocused ? [0, -10, 10, 0] : 0,
                scale: isFocused ? 1.1 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <Search className={cn(
                "h-4 w-4 transition-colors duration-300",
                isFocused ? "text-blue-500" : "text-muted-foreground"
              )} />
            </motion.div>

            {/* Input principal */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSuggestions(e.target.value.length > 0)
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsFocused(false), 200)
                  setTimeout(() => setShowSuggestions(false), 300)
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn(
                  "border-0 bg-transparent p-0 text-sm font-medium",
                  "placeholder:text-muted-foreground/60",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "transition-all duration-300"
                )}
              />
              
              {/* Efecto de escritura animado */}
              {isFocused && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 w-full rounded-full" />
                </motion.div>
              )}
            </div>

            {/* Botón de búsqueda */}
            <div className="flex items-center gap-1">
              {/* Botón de búsqueda compacto */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => handleSearch(query)}
                  className={cn(
                    "h-7 px-3 rounded-full font-medium text-xs",
                    "bg-gradient-to-r from-blue-500 to-purple-600",
                    "hover:from-blue-600 hover:to-purple-700",
                    "text-white shadow-lg",
                    "transition-all duration-300",
                    "hover:shadow-blue-500/25",
                    isFocused && "shadow-blue-500/30"
                  )}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Buscar
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Atajos de teclado compactos */}
          <motion.div
            className="flex items-center justify-center px-3 pb-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: isFocused ? 1 : 0, 
              height: isFocused ? "auto" : 0 
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Enter</kbd>
                <span>buscar</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Esc</kbd>
                <span>limpiar</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Panel de sugerencias compacto */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              className="absolute top-full left-0 right-0 mt-1 mx-1"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl overflow-hidden">
                <div className="p-1">
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    Sugerencias
                  </div>
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      whileHover={{ x: 2 }}
                      onClick={() => {
                        setQuery(suggestion.label)
                        handleSearch(suggestion.label)
                      }}
                    >
                      <span className="text-sm">{suggestion.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-xs">{suggestion.label}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {suggestion.category}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  )
}
