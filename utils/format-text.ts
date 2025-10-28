/**
 * Agrega espacios a texto sin espacios extraído de PDF
 * "Normadegasesdeescape" -> "Norma de gases de escape"
 */
export function formatTextWithSpaces(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Diccionario de palabras comunes que deben separarse
  const palabras = [
    'de', 'del', 'la', 'las', 'el', 'los', 'para', 'con', 'en', 'y', 'o', 'a',
    'asientos', 'sistema', 'control', 'calefacción', 'volante', 'retrovisores',
    'interior', 'exterior', 'ajuste', 'automático', 'paquete', 'equipamientos',
    'gases', 'escape', 'presión', 'neumáticos', 'reparación', 'juego',
    'tornillos', 'antirrobo', 'llantas', 'deportivo', 'adicionales',
    'específicos', 'calefactable', 'dispositivo', 'alarma', 'mando',
    'distancia', 'acceso', 'confort', 'deflector', 'viento', 'modos',
    'triángulo', 'emergencia', 'botiquín', 'primeros', 'auxilios',
    'fijación', 'asiento', 'infantil', 'acompañante', 'delanteros',
    'asistente', 'luz', 'carretera', 'faros', 'funciones', 'ampliadas',
    'llamada', 'obligatoria', 'bandeja', 'personal', 'radio', 'acabado',
    'intervalo', 'mantenimiento', 'aceite', 'contenidos', 'refrigerante',
    'protección', 'activa', 'peatones', 'vehículo', 'panel', 'instrumentos',
    'español', 'literatura', 'abordo', 'caja', 'cambios', 'doble',
    'embrague', 'velocímetro', 'lectura', 'norma'
  ];
  
  // Aplicar separación por palabras conocidas (múltiples iteraciones)
  for (let i = 0; i < 3; i++) {
    palabras.forEach(palabra => {
      const regex = new RegExp(`(${palabra})([A-Za-záéíóúñÁÉÍÓÚÑ])`, 'gi');
      result = result.replace(regex, '$1 $2');
    });
    
    // Separar minúscula-mayúscula
    result = result.replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2');
    // Número-letra
    result = result.replace(/([0-9])([A-Za-z])/g, '$1 $2');
    // Letra-número  
    result = result.replace(/([a-z])([0-9])/g, '$1 $2');
    // Limpiar múltiples espacios
    result = result.replace(/\s+/g, ' ');
  }
  
  return result.trim();
}

