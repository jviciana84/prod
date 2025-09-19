"use client"

import React, { useState, useRef } from "react"
import { Search, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CompactSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function CompactSearch({ 
  onSearch, 
  placeholder = "Buscar en todo el sistema...", 
  className 
}: CompactSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
    if (e.key === 'Escape') {
      setQuery("")
      setIsExpanded(false)
    }
  }

  return (
    <div 
      className={cn(
        "relative transition-all duration-300 ease-in-out",
        className
      )}
      onMouseEnter={() => {
        setIsExpanded(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }}
      onMouseLeave={() => {
        if (!query.trim()) {
          setIsExpanded(false)
        }
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2",
          "bg-background/95 backdrop-blur-xl shadow-lg",
          "transition-all duration-300",
          isExpanded 
            ? "border-blue-500/30 shadow-blue-500/25 w-80" 
            : "border-blue-500/20 shadow-blue-500/15 w-10"
        )}
        style={{ height: 32 }}
      >
        {/* Estado colapsado - solo icono */}
        {!isExpanded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Estado expandido - buscador completo */}
        {isExpanded && (
          <div className="absolute inset-0 flex items-center gap-2 px-3">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "border-0 bg-transparent p-0 text-sm font-medium flex-1",
                "placeholder:text-muted-foreground/60",
                "focus-visible:ring-0 focus-visible:ring-offset-0"
              )}
              autoComplete="off"
            />

            <button
              type="button"
              onClick={handleSearch}
              className={cn(
                "h-5 w-5 rounded-full",
                "bg-gradient-to-r from-blue-500 to-purple-600",
                "hover:from-blue-600 hover:to-purple-700",
                "text-white shadow-lg",
                "flex items-center justify-center",
                "cursor-pointer hover:scale-105",
                "transition-all duration-200"
              )}
              title="Buscar (Enter)"
            >
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}