"use client"

import { cn } from "@/lib/utils"

interface BMWMSpinnerProps {
  size?: number
  className?: string
}

export function BMWMSpinner({ size = 24, className }: BMWMSpinnerProps) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#0066B1] border-r-[#0066B1] animate-spin"
        style={{ animationDuration: "1.5s" }}
      />
      <div
        className="absolute inset-[2px] rounded-full border-2 border-transparent border-t-[#E52B38] border-l-[#E52B38] animate-spin"
        style={{ animationDuration: "2s", animationDirection: "reverse" }}
      />
      <div
        className="absolute inset-[4px] rounded-full border-2 border-transparent border-b-[#1C69D4] border-r-[#1C69D4] animate-spin"
        style={{ animationDuration: "2.5s" }}
      />
    </div>
  )
}
