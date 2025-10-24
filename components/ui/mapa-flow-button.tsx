"use client"

import { Button } from "@/components/ui/button"
import { Map } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MapaFlowButtonProps {
  className?: string
}

export function MapaFlowButton({ className = "" }: MapaFlowButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push("/dashboard/mapa-flujo")
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            variant="outline"
            size="icon"
            className={`h-6 w-6 rounded-full shadow-sm bg-background/80 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 hover:bg-background/90 transition-all duration-200 hover:scale-110 ${className}`}
          >
            <Map className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Mapa de Flujo</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

