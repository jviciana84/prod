"use client"

import { motion } from "framer-motion"

export function WelcomeHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard BMW & MINI</h1>
      <p className="text-gray-600 dark:text-gray-400">
        "El éxito no es el final, el fracaso no es fatal: es el coraje de continuar lo que cuenta."
      </p>
    </motion.div>
  )
}
