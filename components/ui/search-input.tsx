"use client"

import { useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  showClearButton?: boolean
  onClear?: () => void
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "w-80",
  autoFocus = true,
  showClearButton = true,
  onClear
}: SearchInputProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus automático cuando se carga el componente
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [autoFocus])

  const handleClear = () => {
    onChange("")
    onClear?.()
    // Mantener el focus después de limpiar
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 relative">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="search"
          placeholder={placeholder}
          className={className}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {showClearButton && value && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground"
            title="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Card>
  )
} 