"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"

export function CleanupLocalStorage() {
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleaned, setCleaned] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleCleanup = async () => {
    setIsCleaning(true)
    setError(null)
    
    try {
      console.log('🧹 Iniciando limpieza de localStorage...')
      
      // 1. Verificar si hay usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // 2. Migrar tema a Supabase si existe
      const currentTheme = localStorage.getItem('theme')
      if (currentTheme) {
        console.log('🎨 Migrando tema a Supabase:', currentTheme)
        
        const { error: themeError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme: currentTheme,
            updated_at: new Date().toISOString()
          })

        if (themeError) {
          console.warn('⚠️ Error migrando tema:', themeError)
        } else {
          console.log('✅ Tema migrado exitosamente')
        }
      }

      // 3. Limpiar localStorage de Supabase
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('sb-') || // Supabase keys
          key.includes('supabase') ||
          key.includes('auth') ||
          key === 'theme' // Ya migrado
        )) {
          keysToRemove.push(key)
        }
      }

      console.log('🗑️ Eliminando claves de localStorage:', keysToRemove)
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`  ✓ Eliminado: ${key}`)
      })

      // 4. Limpiar sessionStorage de Supabase
      const sessionKeysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth')
        )) {
          sessionKeysToRemove.push(key)
        }
      }

      console.log('🗑️ Eliminando claves de sessionStorage:', sessionKeysToRemove)
      
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key)
        console.log(`  ✓ Eliminado: ${key}`)
      })

      setCleaned(true)
      console.log('✅ Limpieza completada exitosamente')
      
      // Recargar página después de 2 segundos
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err) {
      console.error('❌ Error durante la limpieza:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsCleaning(false)
    }
  }

  if (cleaned) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-800">Limpieza completada</h3>
            <p className="text-sm text-green-600">
              localStorage y sessionStorage limpiados. La página se recargará automáticamente.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800 mb-2">
            Limpiar datos locales
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Esto eliminará todos los datos de Supabase del navegador y migrará 
            el tema a la base de datos. Útil si experimentas problemas de caché.
          </p>
          
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Error: {error}
            </div>
          )}
          
          <Button
            onClick={handleCleanup}
            disabled={isCleaning}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            {isCleaning ? (
              <>
                <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                Limpiando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar datos locales
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

