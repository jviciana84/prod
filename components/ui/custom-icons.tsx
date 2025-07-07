import type { SVGProps } from "react"

export function NewCarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Coche completamente de frente */}
      <rect x="3" y="10" width="18" height="8" rx="2" />
      <path d="M6 14h.01" /> {/* Faro izquierdo */}
      <path d="M18 14h.01" /> {/* Faro derecho */}
      <path d="M8 18v2" /> {/* Rueda izquierda */}
      <path d="M16 18v2" /> {/* Rueda derecha */}
      <path d="M3 10l2-4h14l2 4" /> {/* Capó */}
      <path d="M7 6h10" /> {/* Techo */}
      {/* Símbolo + en la esquina superior izquierda */}
      <line x1="5" y1="3" x2="9" y2="3" />
      <line x1="7" y1="1" x2="7" y2="5" />
    </svg>
  )
}
