"use client"
import { Button } from "@/components/ui/button"
// import { clearAllSupabaseCookies } from "@/utils/fix-auth"

export function SessionCleanup() {
  const handleCleanup = () => {
    // clearAllSupabaseCookies()
    window.location.href = "/dashboard"
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button onClick={handleCleanup} variant="destructive" size="sm">
        Limpiar Sesión
      </Button>
    </div>
  )
}
