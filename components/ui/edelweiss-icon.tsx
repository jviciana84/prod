import React from 'react'

interface EdelweissIconProps {
  size?: number
  className?: string
}

export function EdelweissIcon({ size = 24, className = "" }: EdelweissIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pétalos exteriores blancos con forma más realista */}
      <g stroke="#000" strokeWidth="2" fill="#fff">
        {/* Pétalos principales - forma más orgánica */}
        <path d="M50 8 L42 22 L28 18 L38 32 L22 36 L32 50 L22 64 L38 68 L28 82 L42 78 L50 92 L58 78 L72 82 L62 68 L78 64 L68 50 L78 36 L62 32 L72 18 L58 22 Z" />
        
        {/* Pétalos intermedios */}
        <path d="M50 12 L45 25 L35 22 L42 35 L30 38 L38 50 L30 62 L42 65 L35 78 L45 75 L50 88 L55 75 L65 78 L58 65 L70 62 L62 50 L70 38 L58 35 L65 22 L55 25 Z" />
      </g>
      
      {/* Centro amarillo con diseño más refinado */}
      <g fill="#FFD700" stroke="#000" strokeWidth="1.5">
        {/* Círculo central */}
        <circle cx="50" cy="50" r="6" />
        
        {/* Formas ovaladas principales */}
        <ellipse cx="50" cy="38" rx="3" ry="6" />
        <ellipse cx="62" cy="50" rx="3" ry="6" transform="rotate(90 62 50)" />
        <ellipse cx="50" cy="62" rx="3" ry="6" transform="rotate(180 50 62)" />
        <ellipse cx="38" cy="50" rx="3" ry="6" transform="rotate(270 38 50)" />
        
        {/* Formas ovaladas diagonales */}
        <ellipse cx="56" cy="44" rx="2.5" ry="5" transform="rotate(45 56 44)" />
        <ellipse cx="56" cy="56" rx="2.5" ry="5" transform="rotate(135 56 56)" />
        <ellipse cx="44" cy="56" rx="2.5" ry="5" transform="rotate(225 44 56)" />
        <ellipse cx="44" cy="44" rx="2.5" ry="5" transform="rotate(315 44 44)" />
        
        {/* Puntos pequeños alrededor */}
        <circle cx="50" cy="30" r="1.2" />
        <circle cx="62" cy="38" r="1.2" />
        <circle cx="70" cy="50" r="1.2" />
        <circle cx="62" cy="62" r="1.2" />
        <circle cx="50" cy="70" r="1.2" />
        <circle cx="38" cy="62" r="1.2" />
        <circle cx="30" cy="50" r="1.2" />
        <circle cx="38" cy="38" r="1.2" />
        
        {/* Puntos intermedios más pequeños */}
        <circle cx="56" cy="32" r="0.8" />
        <circle cx="68" cy="44" r="0.8" />
        <circle cx="68" cy="56" r="0.8" />
        <circle cx="56" cy="68" r="0.8" />
        <circle cx="44" cy="68" r="0.8" />
        <circle cx="32" cy="56" r="0.8" />
        <circle cx="32" cy="44" r="0.8" />
        <circle cx="44" cy="32" r="0.8" />
      </g>
    </svg>
  )
}

// Versión simplificada para iconos pequeños
export function EdelweissIconSimple({ size = 16, className = "" }: EdelweissIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pétalos exteriores */}
      <g stroke="#000" strokeWidth="1.5" fill="#fff">
        <path d="M12 2 L10 8 L4 6 L8 12 L2 14 L6 20 L2 16 L8 18 L4 24 L10 22 L12 28 L14 22 L20 24 L16 18 L22 16 L18 20 L22 14 L16 12 L20 6 L14 8 Z" />
      </g>
      
      {/* Centro amarillo */}
      <g fill="#FFD700" stroke="#000" strokeWidth="1">
        <circle cx="12" cy="12" r="2.5" />
        <circle cx="12" cy="8" r="0.8" />
        <circle cx="16" cy="12" r="0.8" />
        <circle cx="12" cy="16" r="0.8" />
        <circle cx="8" cy="12" r="0.8" />
        <circle cx="14" cy="10" r="0.6" />
        <circle cx="14" cy="14" r="0.6" />
        <circle cx="10" cy="14" r="0.6" />
        <circle cx="10" cy="10" r="0.6" />
      </g>
    </svg>
  )
}
