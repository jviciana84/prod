import { useState, useCallback } from "react"

export function useTableSelection<T extends string | number>() {
  const [selectedRowId, setSelectedRowId] = useState<T | null>(null)

  const handleRowSelect = useCallback((id: T, event: React.MouseEvent) => {
    // No deseleccionar si se hace clic en elementos interactivos
    const target = event.target as Element
    if (target.closest('button') || 
        target.closest('input') || 
        target.closest('[role="combobox"]') || 
        target.closest('span[onClick]') ||
        target.closest('a') ||
        target.closest('[data-interactive]')) {
      return
    }
    
    setSelectedRowId(selectedRowId === id ? null : id)
  }, [selectedRowId])

  const clearSelection = useCallback(() => {
    setSelectedRowId(null)
  }, [])

  const isRowSelected = useCallback((id: T) => {
    return selectedRowId === id
  }, [selectedRowId])

  return {
    selectedRowId,
    handleRowSelect,
    clearSelection,
    isRowSelected
  }
} 