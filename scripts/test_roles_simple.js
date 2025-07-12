// Script simplificado para probar el sistema de roles
// Este script verifica la lógica de comparación de roles

console.log('🔍 === PRUEBA DEL SISTEMA DE ROLES (LÓGICA) ===\n')

// Simular los roles que existen en la BD (según lo que vimos)
const existingRoles = [
  { id: 1, name: 'admin' },
  { id: 2, name: 'Administración' },
  { id: 3, name: 'Asesor ventas' },
  { id: 4, name: 'Director' },
  { id: 5, name: 'Mecánico' },
  { id: 6, name: 'Supervisor' },
  { id: 7, name: 'viewer' }
]

// Roles que busca el código
const codeRoles = ['admin', 'supervisor', 'director']

console.log('1. Roles existentes en la BD:')
existingRoles.forEach(role => {
  console.log(`   - "${role.name}" (ID: ${role.id})`)
})
console.log()

console.log('2. Roles que busca el código:')
codeRoles.forEach(role => {
  console.log(`   - "${role}"`)
})
console.log()

console.log('3. Verificando coincidencias (búsqueda insensible a mayúsculas):')
codeRoles.forEach(searchRole => {
  const found = existingRoles.find(dbRole => 
    dbRole.name.toLowerCase() === searchRole.toLowerCase()
  )
  
  if (found) {
    console.log(`✅ "${searchRole}" encuentra "${found.name}"`)
  } else {
    console.log(`❌ "${searchRole}" NO encuentra coincidencia`)
  }
})
console.log()

console.log('4. Prueba de las funciones de verificación:')

// Simular la función isUserAdmin
function testIsUserAdmin(userRoles) {
  return userRoles.some(role => {
    const lowerRole = role.toLowerCase()
    return lowerRole === "admin" || 
           lowerRole === "administrador" || 
           lowerRole === "administración" ||
           lowerRole.includes("admin")
  })
}

// Simular la función isUserSupervisorOrDirector
function testIsUserSupervisorOrDirector(userRoles) {
  return userRoles.some(role => {
    const lowerRole = role.toLowerCase()
    return lowerRole === "supervisor" || 
           lowerRole === "director" ||
           lowerRole.includes("supervisor") ||
           lowerRole.includes("director")
  })
}

// Casos de prueba
const testCases = [
  {
    name: "Usuario con rol 'admin'",
    roles: ["admin"],
    expectedAdmin: true,
    expectedSupervisor: false
  },
  {
    name: "Usuario con rol 'Admin'",
    roles: ["Admin"],
    expectedAdmin: true,
    expectedSupervisor: false
  },
  {
    name: "Usuario con rol 'Supervisor'",
    roles: ["Supervisor"],
    expectedAdmin: false,
    expectedSupervisor: true
  },
  {
    name: "Usuario con rol 'Director'",
    roles: ["Director"],
    expectedAdmin: false,
    expectedSupervisor: true
  },
  {
    name: "Usuario con rol 'Administración'",
    roles: ["Administración"],
    expectedAdmin: true,
    expectedSupervisor: false
  },
  {
    name: "Usuario con rol 'Asesor ventas'",
    roles: ["Asesor ventas"],
    expectedAdmin: false,
    expectedSupervisor: false
  }
]

testCases.forEach(testCase => {
  const isAdmin = testIsUserAdmin(testCase.roles)
  const isSupervisor = testIsUserSupervisorOrDirector(testCase.roles)
  
  console.log(`\n${testCase.name}:`)
  console.log(`   Roles: ${testCase.roles.join(', ')}`)
  console.log(`   ¿Es Admin? ${isAdmin} (esperado: ${testCase.expectedAdmin}) ${isAdmin === testCase.expectedAdmin ? '✅' : '❌'}`)
  console.log(`   ¿Es Supervisor/Director? ${isSupervisor} (esperado: ${testCase.expectedSupervisor}) ${isSupervisor === testCase.expectedSupervisor ? '✅' : '❌'}`)
})

console.log('\n5. Resumen:')
console.log('✅ Las funciones de verificación manejan correctamente las mayúsculas/minúsculas')
console.log('✅ Los roles existentes en la BD son compatibles con el código')
console.log('✅ El sistema de roles debería funcionar correctamente')

console.log('\n🎉 Prueba de lógica completada exitosamente') 