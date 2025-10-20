import { CleanupLocalStorage } from "@/components/cleanup-localstorage"
import { Card } from "@/components/ui/card"
import { Shield, Database, Trash2 } from "lucide-react"

export default function CleanupPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Administración - Limpieza de Datos
        </h1>
        <p className="text-gray-600 mt-2">
          Herramientas para limpiar datos locales y resolver problemas de caché.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Información sobre el problema */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">
                ¿Por qué limpiar datos locales?
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Problema:</strong> Los datos de Supabase se guardan en localStorage/sessionStorage 
                  del navegador. Si estos datos se corrompen, pueden causar:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Pantallas en blanco</li>
                  <li>Errores de autenticación</li>
                  <li>Datos no actualizados</li>
                  <li>Problemas de caché</li>
                </ul>
                <p>
                  <strong>Solución:</strong> Limpiar estos datos y migrar el tema a la base de datos 
                  para mayor estabilidad.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Herramienta de limpieza */}
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-2">
                Limpiar datos locales
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Esta herramienta eliminará todos los datos de Supabase del navegador 
                y migrará el tema a la base de datos.
              </p>
              <CleanupLocalStorage />
            </div>
          </div>
        </Card>

        {/* Instrucciones */}
        <Card className="p-6 bg-amber-50 border-amber-200">
          <h3 className="font-semibold text-amber-800 mb-3">
            ⚠️ Instrucciones importantes
          </h3>
          <div className="text-sm text-amber-700 space-y-2">
            <p><strong>Antes de limpiar:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Asegúrate de estar autenticado</li>
              <li>Guarda cualquier trabajo pendiente</li>
              <li>La página se recargará automáticamente</li>
            </ul>
            <p><strong>Después de limpiar:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Inicia sesión nuevamente si es necesario</li>
              <li>Verifica que el tema se mantiene</li>
              <li>Prueba las funcionalidades principales</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
