// Script para probar las funciones de permisos
// Ejecutar con: node scripts/test_roles_permissions.js

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (usar variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testRolesSystem() {
  console.log('🔍 === PRUEBA DEL SISTEMA DE ROLES ===\n')

  try {
    // 1. Verificar conexión a Supabase
    console.log('1. Verificando conexión a Supabase...')
    const { data: testData, error: testError } = await supabase
      .from('roles')
      .select('id, name')
      .limit(1)

    if (testError) {
      console.error('❌ Error de conexión:', testError.message)
      return
    }
    console.log('✅ Conexión exitosa\n')

    // 2. Obtener todos los roles
    console.log('2. Obteniendo roles de la base de datos...')
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, description')
      .order('name')

    if (rolesError) {
      console.error('❌ Error obteniendo roles:', rolesError.message)
      return
    }

    console.log('✅ Roles encontrados:')
    roles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id})`)
    })
    console.log()

    // 3. Verificar roles críticos
    console.log('3. Verificando roles críticos...')
    const criticalRoles = ['admin', 'supervisor', 'director']
    
    criticalRoles.forEach(roleName => {
      const found = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase())
      if (found) {
        console.log(`✅ ${roleName} existe como "${found.name}"`)
      } else {
        console.log(`❌ ${roleName} NO existe`)
      }
    })
    console.log()

    // 4. Verificar usuarios con roles
    console.log('4. Verificando usuarios con roles...')
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles (
          name,
          description
        )
      `)
      .limit(10)

    if (userRolesError) {
      console.error('❌ Error obteniendo user_roles:', userRolesError.message)
    } else {
      console.log('✅ Usuarios con roles:')
      userRoles.forEach(ur => {
        console.log(`   - Usuario ${ur.user_id}: ${ur.roles?.name || 'Sin rol'}`)
      })
    }
    console.log()

    // 5. Probar búsqueda insensible a mayúsculas
    console.log('5. Probando búsqueda insensible a mayúsculas...')
    const testSearches = ['admin', 'ADMIN', 'Admin', 'supervisor', 'SUPERVISOR', 'Supervisor']
    
    testSearches.forEach(searchTerm => {
      const found = roles.find(r => r.name.toLowerCase() === searchTerm.toLowerCase())
      if (found) {
        console.log(`✅ "${searchTerm}" encuentra "${found.name}"`)
      } else {
        console.log(`❌ "${searchTerm}" no encuentra coincidencia`)
      }
    })
    console.log()

    // 6. Resumen
    console.log('6. Resumen del sistema:')
    console.log(`   - Total de roles: ${roles.length}`)
    console.log(`   - Usuarios con roles: ${userRoles?.length || 0}`)
    console.log(`   - Roles críticos encontrados: ${criticalRoles.filter(r => 
      roles.find(role => role.name.toLowerCase() === r.toLowerCase())
    ).length}/${criticalRoles.length}`)

    // 7. Recomendaciones
    console.log('\n7. Recomendaciones:')
    const missingRoles = criticalRoles.filter(r => 
      !roles.find(role => role.name.toLowerCase() === r.toLowerCase())
    )
    
    if (missingRoles.length > 0) {
      console.log('❌ Roles faltantes:')
      missingRoles.forEach(role => {
        console.log(`   - ${role}`)
      })
    } else {
      console.log('✅ Todos los roles críticos están presentes')
    }

    console.log('\n🎉 Prueba completada exitosamente')

  } catch (error) {
    console.error('❌ Error inesperado:', error.message)
  }
}

// Ejecutar la prueba
testRolesSystem() 