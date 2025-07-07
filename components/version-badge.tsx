"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { getVersionInfo } from "@/lib/version"

interface VersionBadgeProps {
  className?: string
}

export function VersionBadge({ className }: VersionBadgeProps) {
  const versionInfo = getVersionInfo()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
            <Info className="h-3 w-3" />
            <span>v{versionInfo.version}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>CVO versión {versionInfo.version}</p>
          <p className="text-xs text-muted-foreground">controlvo.ovh</p>
          <p className="text-xs text-muted-foreground">Última actualización: {versionInfo.lastUpdate}</p>
          <p className="text-xs text-muted-foreground">Entorno: {versionInfo.environment}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
