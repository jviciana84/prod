/**
 * Script para migrar temas de localStorage a Supabase
 * Ejecutar en la consola del navegador cuando el usuario esté autenticado
 */

async function migrateThemesToSupabase() {
  console.log('🔄 Iniciando migración de temas a Supabase...')
  
  try {
    // Verificar que Supabase esté disponible
    if (typeof window === 'undefined' || !window.supabase) {
      console.error('❌ Supabase no está disponible')
      return
    }

    const supabase = window.supabase
    
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ Usuario no autenticado:', userError)
      return
    }

    console.log('👤 Usuario autenticado:', user.email)

    // Obtener tema actual de localStorage
    const currentTheme = localStorage.getItem('theme')
    
    if (!currentTheme) {
      console.log('ℹ️ No hay tema guardado en localStorage')
      return
    }

    console.log('🎨 Tema actual en localStorage:', currentTheme)

    // Verificar si ya existe una preferencia
    const { data: existingPrefs, error: fetchError } = await supabase
      .from('user_preferences')
      .select('theme')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error obteniendo preferencias existentes:', fetchError)
      return
    }

    if (existingPrefs) {
      console.log('ℹ️ Ya existen preferencias de usuario:', existingPrefs.theme)
      
      // Preguntar si quiere sobrescribir
      const shouldOverwrite = confirm(
        `Ya tienes un tema guardado (${existingPrefs.theme}). ¿Quieres cambiarlo por el de localStorage (${currentTheme})?`
      )
      
      if (!shouldOverwrite) {
        console.log('✅ Migración cancelada por el usuario')
        return
      }
    }

    // Guardar/actualizar tema en Supabase
    const { error: upsertError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        theme: currentTheme,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('❌ Error guardando tema en Supabase:', upsertError)
      return
    }

    console.log('✅ Tema migrado exitosamente a Supabase:', currentTheme)
    
    // Opcional: Limpiar localStorage después de migración exitosa
    const shouldCleanLocalStorage = confirm(
      '¿Quieres eliminar el tema de localStorage ahora que está guardado en Supabase?'
    )
    
    if (shouldCleanLocalStorage) {
      localStorage.removeItem('theme')
      console.log('🧹 Tema eliminado de localStorage')
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
  }
}

// Función para verificar el estado actual
async function checkThemeStatus() {
  console.log('🔍 === ESTADO ACTUAL DE TEMAS ===')
  
  try {
    // 1. Verificar localStorage
    const localTheme = localStorage.getItem('theme')
    console.log('📱 localStorage theme:', localTheme || 'No definido')
    
    // 2. Verificar Supabase
    if (typeof window !== 'undefined' && window.supabase) {
      const supabase = window.supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: prefs, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          console.log('🗄️ Supabase theme:', 'Error obteniendo preferencias')
        } else {
          console.log('🗄️ Supabase theme:', prefs?.theme || 'No definido')
        }
      } else {
        console.log('🗄️ Supabase theme:', 'Usuario no autenticado')
      }
    } else {
      console.log('🗄️ Supabase theme:', 'Supabase no disponible')
    }
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error)
  }
}

// Exportar funciones para uso manual
window.migrateThemesToSupabase = migrateThemesToSupabase
window.checkThemeStatus = checkThemeStatus

console.log('📋 Funciones disponibles:')
console.log('  - migrateThemesToSupabase() - Migrar tema a Supabase')
console.log('  - checkThemeStatus() - Verificar estado actual')

