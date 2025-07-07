"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import type React from "react"

interface KpiCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  image: string
  loading?: boolean
}

export function KpiCard({ title, value, change, icon, image, loading = false }: KpiCardProps) {
  const isPositive = change.startsWith("+")

  return (
    <Card className="relative overflow-hidden h-[160px] group">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
      <CardContent className="relative z-10 flex h-full flex-col justify-between p-4 text-white">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-medium text-white/90">{title}</h3>
          {icon}
        </div>
        <div>
          {loading ? (
            <BMWMSpinner size={32} className="text-white" />
          ) : (
            <>
              <p className="text-4xl font-bold">{value}</p>
              <p className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>{change}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
