"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SelectableTableRowProps {
  id: string | number
  isSelected: boolean
  onSelect: (id: string | number, event: React.MouseEvent) => void
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function SelectableTableRow({
  id,
  isSelected,
  onSelect,
  children,
  className,
  disabled = false
}: SelectableTableRowProps) {
  const handleClick = (event: React.MouseEvent) => {
    if (disabled) return
    
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
    
    onSelect(id, event)
  }

  return (
    <tr
      onClick={handleClick}
      data-selected={isSelected}
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "bg-muted/80 hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      style={{
        position: 'relative'
      }}
    >
      {children}
      {/* Indicador de selección - punto en la esquina superior derecha */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            backgroundColor: 'hsl(var(--primary))',
            borderRadius: '50%',
            zIndex: 10,
          }}
        />
      )}
      {/* Borde lateral en la primera celda */}
      {isSelected && (
        <style jsx>{`
          tr[data-selected="true"] td:first-child {
            border-left: 4px solid hsl(var(--primary));
            padding-left: calc(1rem - 4px);
          }
        `}</style>
      )}
    </tr>
  )
} 