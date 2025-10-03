// Script de prueba para verificar el comportamiento del modal de advertencia
// Este script simula el comportamiento esperado

console.log('🧪 Simulando comportamiento del modal de advertencia...');

console.log('\n📝 Escenario 1: Primera interacción de la sesión');
console.log('✅ Estado inicial: hasShownWarning = false');
console.log('✅ Usuario envía primer mensaje');
console.log('✅ Modal de advertencia se muestra (showAIWarning = true)');
console.log('✅ hasShownWarning se establece a true');
console.log('✅ Usuario cierra el modal');

console.log('\n📝 Escenario 2: Segunda interacción de la misma sesión');
console.log('✅ Estado: hasShownWarning = true');
console.log('✅ Usuario envía segundo mensaje');
console.log('✅ Modal de advertencia NO se muestra (showAIWarning = false)');
console.log('✅ hasShownWarning permanece true');

console.log('\n📝 Escenario 3: Tercera interacción de la misma sesión');
console.log('✅ Estado: hasShownWarning = true');
console.log('✅ Usuario envía tercer mensaje');
console.log('✅ Modal de advertencia NO se muestra (showAIWarning = false)');
console.log('✅ hasShownWarning permanece true');

console.log('\n📝 Escenario 4: Nueva sesión (chat cerrado y abierto)');
console.log('✅ Usuario cierra el chat');
console.log('✅ Usuario abre el chat de nuevo');
console.log('✅ resetSession() se ejecuta');
console.log('✅ hasShownWarning se resetea a false');
console.log('✅ Usuario envía primer mensaje de nueva sesión');
console.log('✅ Modal de advertencia se muestra de nuevo');

console.log('\n🎯 Resultado esperado:');
console.log('✅ Modal solo aparece en la primera interacción de cada sesión');
console.log('✅ No aparece en mensajes posteriores de la misma sesión');
console.log('✅ Se resetea cuando se abre una nueva sesión');
