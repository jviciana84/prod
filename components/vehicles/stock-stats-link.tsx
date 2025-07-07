"use client"

import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"
import Link from "next/link"

export default function StockStatsLink() {
  return (
    <Link href="/dashboard/vehicles/stats">
      <Button variant="outline" className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        <span>Ver Estadísticas</span>
      </Button>
    </Link>
  )
}
