import React from 'react'

interface ComparadorIconProps {
  className?: string
  size?: number
}

export function ComparadorIcon({ className = "h-5 w-5", size }: ComparadorIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
    >
      {/* Icono de comparación con dos flechas y gráfico */}
      <path d="M3 12h4l3-9 4 18 3-9h4" />
      <circle cx="12" cy="12" r="10" />
      <path d="M8 15l-3-3 3-3" />
      <path d="M16 9l3 3-3 3" />
    </svg>
  )
}

