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
  const { search, results, isLoading } = useGlobalSearch()

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setCurrentQuery(query)
    setShowResultsModal(true)
    
    // Realizar búsqueda global
    await search(query)
  }

  const handleCloseModal = () => {
    setShowResultsModal(false)
    setCurrentQuery("")
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
      />
    </>
  )
}