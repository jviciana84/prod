"use client"

import React, { useState } from "react"
import { CompactSearch } from "./compact-search"
import { SearchResultsModal } from "./search-results-modal"
import { useGlobalSearch } from "@/hooks/use-global-search"

interface CompactSearchWithModalProps {
  className?: string
}

export function CompactSearchWithModal({ className }: CompactSearchWithModalProps) {
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [currentQuery, setCurrentQuery] = useState("")
  const [ducDetails, setDucDetails] = useState<any>(null)
  const { search, results, isLoading, searchDucDetails } = useGlobalSearch()

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setCurrentQuery(query)
    setShowResultsModal(true)
    setDucDetails(null)
    
    // Realizar búsqueda global
    const searchResults = await search(query)
    
    // Si hay resultados, buscar detalles en DUC
    if (searchResults && searchResults.length > 0) {
      const firstResult = searchResults[0]
      const ducData = await searchDucDetails(firstResult.license_plate)
      setDucDetails(ducData)
    }
  }

  const handleCloseModal = () => {
    setShowResultsModal(false)
    setCurrentQuery("")
    setDucDetails(null)
  }

  return (
    <>
      <CompactSearch 
        onSearch={handleSearch}
        placeholder="Buscar en todo el sistema..."
        className={className}
      />
      
      <SearchResultsModal
        isOpen={showResultsModal}
        onClose={handleCloseModal}
        results={results}
        query={currentQuery}
        isLoading={isLoading}
        ducDetails={ducDetails}
      />
    </>
  )
}