// Script de prueba para verificar la detección de consultas
console.log('🧪 Simulando detección de consultas...');

console.log('\n📝 Consultas ESPECÍFICAS de CVO (deben acceder a base de datos):');
console.log('✅ "¿Cuántos coches ha vendido Pol?" → CVO específica');
console.log('✅ "¿Qué vehículos hay en stock?" → CVO específica');
console.log('✅ "¿Cuál es el teléfono de Javier?" → CVO específica');
console.log('✅ "¿Cuántas entregas hay pendientes?" → CVO específica');
console.log('✅ "¿Qué incentivos tiene María?" → CVO específica');

console.log('\n📝 Consultas GENERALES (deben usar inteligencia general):');
console.log('✅ "¿Qué colonia me recomiendas?" → General');
console.log('✅ "¿Cómo hacer una fórmula Excel?" → General');
console.log('✅ "¿Cuál es la capital de Francia?" → General');
console.log('✅ "¿Consejos para impresionar al jefe?" → General');
console.log('✅ "¿Cómo mejorar las ventas?" → General');

console.log('\n🔍 Lógica de detección:');
console.log('✅ Palabras clave CVO: cuantos, vendido, asesor, ventas, stock, vehículo, matrícula, cliente, pedido, entrega, foto, incentivo, extorno, garantía');
console.log('✅ Si contiene palabras CVO → Acceder a Supabase');
console.log('✅ Si NO contiene palabras CVO → Usar inteligencia general');

console.log('\n🎯 Comportamiento esperado:');
console.log('✅ Consultas CVO: Solo datos reales de la base de datos');
console.log('✅ Consultas generales: Inteligencia completa como ChatGPT');
console.log('✅ Diferenciación clara: contextData.is_general_query vs contextData.query_type');
console.log('✅ Respuestas útiles en ambos casos');

console.log('\n💡 Ejemplos de respuestas:');
console.log('📊 CVO: "Pol ha vendido 3 coches: BMW X5, MINI Cooper, BMW Serie 3"');
console.log('🧠 General: "Para impresionar a tu jefe con colonias, te recomiendo Tom Ford Vanille Fatale..."');
console.log('📊 CVO: "No se encontraron ventas para Pol en la base de datos"');
console.log('🧠 General: "Para mejorar las ventas, te sugiero: 1) Conocer bien el producto..."');
