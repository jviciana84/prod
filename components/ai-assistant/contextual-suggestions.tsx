"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, TrendingUp, Car, ShoppingCart, Truck, FileText, Wrench } from "lucide-react"

interface ContextualSuggestionsProps {
  currentPage: string
  onSuggestionClick: (suggestion: string) => void
}

export function ContextualSuggestions({ currentPage, onSuggestionClick }: ContextualSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    const pageSuggestions = getSuggestionsForPage(currentPage)
    setSuggestions(pageSuggestions)
  }, [currentPage])

  const getSuggestionsForPage = (page: string): string[] => {
    const suggestionsMap: Record<string, string[]> = {
      '/dashboard': [
        "¿Cuántos vehículos hay en stock?",
        "¿Cuáles son las ventas de este mes?",
        "¿Hay entregas pendientes?",
        "¿Cuál es el resumen general del sistema?"
      ],
      '/vehicles': [
        "¿Qué vehículos necesitan reparación?",
        "¿Cuál es el estado del taller?",
        "¿Hay vehículos listos para entrega?",
        "¿Cuántos BMW y MINI hay en stock?"
      ],
      '/sales': [
        "¿Cuáles son los mejores vendedores?",
        "¿Qué modelos se venden más?",
        "¿Hay ventas pendientes de entrega?",
        "¿Cuántas ventas hay este mes?"
      ],
      '/entregas': [
        "¿Cuántas entregas están pendientes?",
        "¿Hay entregas atrasadas?",
        "¿Cuál es el estado de las entregas?",
        "¿Necesito ayuda con alguna entrega?"
      ],
      '/cvo': [
        "¿Cómo funciona el sistema CVO?",
        "¿Cuántos CVO están pendientes?",
        "¿Qué es un certificado de vehículo ocasional?",
        "¿Cuál es el estado de los CVO?"
      ],
      '/workshop': [
        "¿Cuál es el estado del taller?",
        "¿Hay vehículos en reparación?",
        "¿Cuántos días promedio en taller?",
        "¿Qué vehículos necesitan pintura?"
      ]
    }

    return suggestionsMap[page] || [
      "¿Cómo puedo ayudarte?",
      "¿Qué información necesitas?",
      "¿Tienes alguna pregunta sobre el sistema?"
    ]
  }

  const getIconForSuggestion = (suggestion: string) => {
    if (suggestion.includes('stock') || suggestion.includes('vehículos')) return <Car className="h-4 w-4" />
    if (suggestion.includes('ventas') || suggestion.includes('vendedores')) return <ShoppingCart className="h-4 w-4" />
    if (suggestion.includes('entrega')) return <Truck className="h-4 w-4" />
    if (suggestion.includes('CVO') || suggestion.includes('certificado')) return <FileText className="h-4 w-4" />
    if (suggestion.includes('taller') || suggestion.includes('reparación')) return <Wrench className="h-4 w-4" />
    return <TrendingUp className="h-4 w-4" />
  }

  if (suggestions.length === 0) return null

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Sugerencias para esta página
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="w-full text-left justify-start h-auto p-3"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <div className="flex items-center gap-2">
              {getIconForSuggestion(suggestion)}
              <span className="text-sm">{suggestion}</span>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
