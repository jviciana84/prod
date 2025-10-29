"use client"

import { useState, useCallback } from "react"

interface SearchResult {
  id: string
  type: 'vehicle' | 'sale' | 'delivery' | 'stock' | 'photo' | 'key' | 'document'
  license_plate: string
  model?: string
  brand?: string
  status?: string
  data: Record<string, any>
}

export function useGlobalSearch() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  // ✅ MIGRADO A API ROUTE: Búsqueda global usando servidor para evitar cliente zombie
  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return []

    setIsLoading(true)

    try {
      const response = await fetch('/api/search/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        throw new Error('Error en búsqueda global')
      }

      const { results: searchResults } = await response.json()
      setResults(searchResults)
      return searchResults

    } catch (error) {
      console.error('Error en búsqueda global:', error)
      setResults([])
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ✅ MIGRADO A API ROUTE: Búsqueda de detalles DUC usando servidor
  const searchDucDetails = useCallback(async (matricula: string) => {
    if (!matricula) return null
    
    try {
      const response = await fetch('/api/search/duc-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matricula })
      })

      if (!response.ok) {
        return null
      }

      const { ducDetails } = await response.json()
      return ducDetails

    } catch (error) {
      console.error('Error buscando detalles de DUC:', error)
      return null
    }
  }, [])

  return {
    search,
    results,
    isLoading,
    searchDucDetails
  }
}
