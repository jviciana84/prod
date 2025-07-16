// Script de prueba para la página de gestión de columnas
// Ejecutar en el navegador en la consola de desarrollador

console.log('🧪 Iniciando pruebas de la página de gestión de columnas...')

// 1. Verificar que la página existe
async function testPageExists() {
  console.log('1. 🔍 Verificando que la página existe...')
  
  try {
    const response = await fetch('/dashboard/columnas')
    if (response.ok) {
      console.log('✅ La página /dashboard/columnas existe y es accesible')
      return true
    } else {
      console.log('❌ La página /dashboard/columnas no es accesible:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Error al verificar la página:', error)
    return false
  }
}

// 2. Verificar que el enlace del sidebar existe
function testSidebarLink() {
  console.log('2. 🔍 Verificando enlace en el sidebar...')
  
  const sidebarLinks = document.querySelectorAll('a[href="/dashboard/columnas"]')
  if (sidebarLinks.length > 0) {
    console.log('✅ Enlace "Gestión de Columnas" encontrado en el sidebar')
    return true
  } else {
    console.log('❌ Enlace "Gestión de Columnas" NO encontrado en el sidebar')
    console.log('💡 Verificar que tienes permisos de administrador')
    return false
  }
}

// 3. Verificar permisos de usuario
async function testUserPermissions() {
  console.log('3. 🔍 Verificando permisos de usuario...')
  
  try {
    const response = await fetch('/api/auth/user-roles')
    if (response.ok) {
      const roles = await response.json()
      console.log('📋 Roles del usuario:', roles)
      
      const hasAdminRole = roles.some(role => 
        role.toLowerCase() === 'admin' || 
        role.toLowerCase() === 'administración' ||
        role.toLowerCase() === 'director' ||
        role.toLowerCase() === 'supervisor'
      )
      
      if (hasAdminRole) {
        console.log('✅ Usuario tiene permisos de administrador')
        return true
      } else {
        console.log('❌ Usuario NO tiene permisos de administrador')
        return false
      }
    } else {
      console.log('❌ No se pudieron obtener los roles del usuario')
      return false
    }
  } catch (error) {
    console.log('❌ Error al verificar permisos:', error)
    return false
  }
}

// 4. Verificar función SQL
async function testSQLFunction() {
  console.log('4. 🔍 Verificando función SQL get_table_structure...')
  
  try {
    const response = await fetch('/api/test-table-structure')
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Función SQL funciona correctamente')
      return true
    } else {
      console.log('❌ Función SQL no funciona:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Error al verificar función SQL:', error)
    return false
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando todas las pruebas...\n')
  
  const results = {
    pageExists: await testPageExists(),
    sidebarLink: testSidebarLink(),
    userPermissions: await testUserPermissions(),
    sqlFunction: await testSQLFunction()
  }
  
  console.log('\n📊 Resumen de resultados:')
  console.log('✅ Página existe:', results.pageExists)
  console.log('✅ Enlace en sidebar:', results.sidebarLink)
  console.log('✅ Permisos de usuario:', results.userPermissions)
  console.log('✅ Función SQL:', results.sqlFunction)
  
  const allPassed = Object.values(results).every(result => result)
  
  if (allPassed) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! La funcionalidad está lista para usar.')
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisar los errores arriba.')
  }
  
  return results
}

// Ejecutar las pruebas
runAllTests() 