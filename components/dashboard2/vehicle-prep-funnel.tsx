"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

export function VehiclePrepFunnel() {
  const stages = [
    { name: "Recepción", count: 45, color: "bg-blue-500" },
    { name: "Preparación", count: 32, color: "bg-yellow-500" },
    { name: "Fotografía", count: 28, color: "bg-orange-500" },
    { name: "Validación", count: 25, color: "bg-green-500" },
    { name: "Entregado", count: 22, color: "bg-purple-500" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Embudo de Preparación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center space-x-3"
              >
                <div className={`w-4 h-4 rounded-full ${stage.color}`}></div>
                <span className="text-sm font-medium flex-1">{stage.name}</span>
                <span className="text-sm font-bold">{stage.count}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
