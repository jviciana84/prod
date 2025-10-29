#!/usr/bin/env node

/**
 * Script para limpiar datos de prueba del sistema de recepción
 * Ejecutar: node scripts/limpiar_datos_recepcion.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function limpiarDatos() {
  console.log('🧹 Iniciando limpieza de datos de recepción...\n')

  try {
    // 1. Contar datos antes de limpiar
    console.log('📊 Estado actual:')
    const { data: beforeVisitas } = await supabase
      .from('visit_assignments')
      .select('id', { count: 'exact', head: true })
    
    const { data: beforeAsesores } = await supabase
      .from('advisors')
      .select('total_visits')
    
    const totalVisitasAsesores = beforeAsesores?.reduce((sum, a) => sum + (a.total_visits || 0), 0) || 0
    
    console.log(`   📋 Historial de visitas: ${beforeVisitas?.length || 0}`)
    console.log(`   👥 Total asesores: ${beforeAsesores?.length || 0}`)
    console.log(`   📈 Suma visitas asesores: ${totalVisitasAsesores}\n`)

    // 2. Eliminar historial de visitas
    console.log('🗑️  Eliminando historial de visitas...')
    const { error: deleteError } = await supabase
      .from('visit_assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos

    if (deleteError) {
      console.error('❌ Error eliminando visitas:', deleteError.message)
      return
    }
    console.log('   ✅ Historial eliminado\n')

    // 3. Resetear contadores de asesores
    console.log('🔄 Reseteando contadores de asesores...')
    const { data: asesores, error: fetchError } = await supabase
      .from('advisors')
      .select('id')

    if (fetchError) {
      console.error('❌ Error obteniendo asesores:', fetchError.message)
      return
    }

    for (const asesor of asesores) {
      const { error: updateError } = await supabase
        .from('advisors')
        .update({
          total_visits: 0,
          visits_today: 0,
          current_turn_priority: 0,
          last_visit_date: null
        })
        .eq('id', asesor.id)

      if (updateError) {
        console.error(`   ⚠️ Error actualizando asesor ${asesor.id}`)
      }
    }
    console.log('   ✅ Contadores reseteados\n')

    // 4. Verificar resultado final
    console.log('📊 Estado final:')
    const { data: afterVisitas } = await supabase
      .from('visit_assignments')
      .select('id', { count: 'exact', head: true })
    
    const { data: afterAsesores } = await supabase
      .from('advisors')
      .select('total_visits')
    
    const totalVisitasDespues = afterAsesores?.reduce((sum, a) => sum + (a.total_visits || 0), 0) || 0
    
    console.log(`   📋 Historial de visitas: ${afterVisitas?.length || 0}`)
    console.log(`   👥 Total asesores: ${afterAsesores?.length || 0}`)
    console.log(`   📈 Suma visitas asesores: ${totalVisitasDespues}`)

    console.log('\n✅ Limpieza completada correctamente')

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message)
    process.exit(1)
  }
}

// Ejecutar
limpiarDatos()

