"use client"

import { useEffect } from "react"

// PUSH PROCESSOR ANULADO - Solo campana activa
export function PushProcessor() {
  useEffect(() => {
    // PUSH NOTIFICATIONS ANULADO - No procesar push
    console.log("Push processor anulado - solo campana activa")
  }, [])

  return null
}
