"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"

export function TopPerformers() {
  const performers = [
    { name: "Carlos Ruiz", sales: 12, avatar: "/woman-portrait.png" },
    { name: "Ana García", sales: 10, avatar: "/thoughtful-man-portrait.png" },
    { name: "Miguel López", sales: 8, avatar: "/female-professional.png" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Top Comerciales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performers.map((performer, index) => (
              <motion.div
                key={performer.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center space-x-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={performer.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {performer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium flex-1">{performer.name}</span>
                <span className="text-sm font-bold">{performer.sales} ventas</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
