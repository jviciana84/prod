"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/auth/auth-provider"

const SESSION_START_KEY = "dashboard_session_start"
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000 // 4 horas

export function SessionRefresh() {
  const { signOut } = useAuth()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const signOutRef = useRef(signOut)
  signOutRef.current = signOut

  useEffect(() => {
    let sessionStart = 0
    try {
      const stored = sessionStorage.getItem(SESSION_START_KEY)
      if (stored) {
        sessionStart = parseInt(stored, 10)
      }
      if (!sessionStart || isNaN(sessionStart)) {
        sessionStart = Date.now()
        sessionStorage.setItem(SESSION_START_KEY, String(sessionStart))
      }
    } catch {
      sessionStart = Date.now()
    }

    const elapsed = Date.now() - sessionStart
    const remaining = Math.max(0, SESSION_DURATION_MS - elapsed)

    const logoutAndRedirect = async () => {
      try {
        await signOutRef.current?.()
      } catch (e) {
        console.warn("Error al cerrar sesión automática:", e)
      }
      try {
        sessionStorage.removeItem(SESSION_START_KEY)
      } catch {}
      window.location.href = "/"
    }

    if (remaining === 0) {
      logoutAndRedirect()
      return
    }

    timeoutRef.current = setTimeout(logoutAndRedirect, remaining)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  return null
}
