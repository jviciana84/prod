"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function FixTriggerPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const fixTrigger = async () => {
    setIsLoading(true)
    setResults([])

    try {
      console.log("🔧 Iniciando corrección del trigger...")

      // Script SQL para corregir el trigger
      const fixTriggerSQL = `
        -- 1. Crear función corregida del trigger
        CREATE OR REPLACE FUNCTION auto_assign_photographer()
        RETURNS TRIGGER AS $func$
        DECLARE
          photographer_record RECORD;
          total_assigned INTEGER;
          current_assignments JSONB := '{}'::jsonb;
          best_photographer UUID := NULL;
          best_deficit NUMERIC := -1000;
          total_vehicles INTEGER;
        BEGIN
          -- Solo proceder si el nuevo registro no tiene fotógrafo asignado
          IF NEW.assigned_to IS NULL AND NEW.photos_completed IS FALSE THEN
            -- Obtener el total de vehículos asignados
            SELECT COUNT(*) INTO total_assigned FROM fotos WHERE assigned_to IS NOT NULL;
            
            -- Obtener el total de vehículos (incluyendo el nuevo)
            total_vehicles := total_assigned + 1;
            
            -- Obtener asignaciones actuales por fotógrafo
            SELECT jsonb_object_agg(assigned_to, cnt) INTO current_assignments
            FROM (
              SELECT assigned_to, COUNT(*) as cnt
              FROM fotos
              WHERE assigned_to IS NOT NULL
              GROUP BY assigned_to
            ) AS counts;
            
            -- Si no hay asignaciones, inicializar
            IF current_assignments IS NULL THEN
              current_assignments := '{}'::jsonb;
            END IF;
            
            -- Encontrar el fotógrafo con mayor déficit (no ordenar por percentage DESC)
            FOR photographer_record IN 
              SELECT 
                user_id, 
                percentage
              FROM fotos_asignadas
              WHERE is_active = TRUE
              ORDER BY user_id -- Ordenar por ID para distribución equitativa
            LOOP
              DECLARE
                current_count INTEGER := COALESCE((current_assignments->>photographer_record.user_id::text)::INTEGER, 0);
                target_count NUMERIC := total_vehicles * photographer_record.percentage / 100;
                deficit NUMERIC := target_count - current_count;
              BEGIN
                -- Si este fotógrafo tiene mayor déficit, seleccionarlo
                IF deficit > best_deficit THEN
                  best_deficit := deficit;
                  best_photographer := photographer_record.user_id;
                END IF;
              END;
            END LOOP;
            
            -- Asignar al mejor fotógrafo encontrado
            IF best_photographer IS NOT NULL THEN
              NEW.assigned_to := best_photographer;
              NEW.original_assigned_to := best_photographer;
            END IF;
          END IF;
          
          RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- 2. Recrear el trigger
        DROP TRIGGER IF EXISTS assign_photographer_trigger ON fotos;
        CREATE TRIGGER assign_photographer_trigger
        BEFORE INSERT ON fotos
        FOR EACH ROW
        EXECUTE FUNCTION auto_assign_photographer();
      `

      // Ejecutar el script SQL
      const { error } = await supabase.rpc('exec_sql', { sql: fixTriggerSQL })

      if (error) {
        console.error("❌ Error al ejecutar el script:", error)
        toast({
          title: "Error",
          description: `Error al corregir el trigger: ${error.message}`,
          variant: "destructive",
        })
        setResults([{ step: "Corrección del trigger", success: false, error: error.message }])
      } else {
        console.log("✅ Trigger corregido exitosamente")
        toast({
          title: "Éxito",
          description: "Trigger de asignación automática corregido exitosamente",
        })
        setResults([{ step: "Corrección del trigger", success: true }])
      }

    } catch (error) {
      console.error("❌ Error completo:", error)
      toast({
        title: "Error",
        description: "Error interno del servidor",
        variant: "destructive",
      })
      setResults([{ step: "Corrección del trigger", success: false, error: String(error) }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Corregir Trigger de Asignación</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Corrección del Trigger de Asignación Automática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Este script corregirá el trigger de asignación automática para que distribuya los coches 
            equitativamente según los porcentajes configurados, en lugar de asignar siempre al fotógrafo 
            con mayor porcentaje.
          </p>

          <Button 
            onClick={fixTrigger} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <BMWMSpinner size={16} className="mr-2" />
                Corrigiendo trigger...
              </>
            ) : (
              "Corregir Trigger"
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Resultados:</h3>
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {result.step}: {result.success ? "✅ Completado" : `❌ Error: ${result.error}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 