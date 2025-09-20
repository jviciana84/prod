"use client"

import { useState } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AIAssistantSimple() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botón flotante simple para debug */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>

      {/* Modal simple para debug */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Asistente IA - Prueba</h2>
            <p className="mb-4">¡El asistente está funcionando!</p>
            <Button onClick={() => setIsOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
