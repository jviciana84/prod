"use client"

import React, { useState } from "react"
import { ModernSearch } from "./modern-search"
import { SearchResultsModal } from "./search-results-modal"
import { useGlobalSearch } from "@/hooks/use-global-search"

interface SearchWithModalProps {
  placeholder?: string
  className?: string
}

export function SearchWithModal({ 
  placeholder = "Buscar en todo el sistema...", 
  className 
}: SearchWithModalProps) {
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
      <ModernSearch 
        onSearch={handleSearch}
        placeholder={placeholder}
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
