// Test del algoritmo de normalización

function normalizeModel(modelo) {
  let normalized = modelo.trim().toLowerCase()
  let base = ''
  let variant = ''
  
  // Detectar BMW eléctricos: i4, i7, i8, iX, iX1, iX2, iX3
  // Orden: iX1/iX2/iX3 primero, luego iX, luego i4/i7
  if (/\bi[xX]\d+/.test(normalized)) {
    // iX1, iX2, iX3
    const match = normalized.match(/\b(i[xX]\d+)\s*([ex]?drive\d+|m\d+)?/i)
    if (match) {
      base = match[1].toLowerCase()
      variant = match[2] ? match[2].toLowerCase() : ''
    }
  }
  else if (/\bi[xX]\b/.test(normalized)) {
    // iX solo
    const match = normalized.match(/\b(i[xX])\s*([ex]?drive\d+|m\d+)?/i)
    if (match) {
      base = match[1].toLowerCase()
      variant = match[2] ? match[2].toLowerCase() : ''
    }
  }
  else if (/\bi\d+/.test(normalized)) {
    // i4, i7, i8
    const match = normalized.match(/\b(i\d+)\s*([ex]?drive\d+|m\d+)?/i)
    if (match) {
      base = match[1].toLowerCase()
      variant = match[2] ? match[2].toLowerCase() : ''
    }
  }
  // Detectar Serie (muy flexible para capturar "Serie", "Srie", "srie", "serie", etc)
  else if (/s[ei]?rie?\s*\d/.test(normalized)) {
    const match = normalized.match(/s[ei]?rie?\s*(\d+)\s*(\d{3}[a-z]*)?\s*(gran\s*coupe|coupe|touring|cabrio|compact)?/i)
    if (match) {
      base = `serie ${match[1]}`
      const motor = match[2] || ''
      const carroceria = match[3] ? ` ${match[3].replace(/\s+/g, ' ')}` : ''
      variant = (motor + carroceria).trim().toLowerCase()
    }
  }
  else if (/\bx\d\b/.test(normalized)) {
    const match = normalized.match(/\b(x\d+)\s*([a-z]*drive\d+[a-z]*)?/i)
    if (match) {
      base = match[1]
      variant = match[2] || ''
    }
  }
  else if (/\bz\d\b/.test(normalized)) {
    const match = normalized.match(/\b(z\d+)\s*(\d{2,3}[a-z]*)?/i)
    if (match) {
      base = match[1]
      variant = match[2] || ''
    }
  }
  else if (/mini/.test(normalized)) {
    if (/\b(\d+)\s*puertas?\b/.test(normalized)) {
      const match = normalized.match(/\b(\d+)\s*puertas?\b/i)
      if (match) {
        base = `mini ${match[1]} puertas`
        if (/cooper\s*se/i.test(normalized)) variant = 'cooper se'
        else if (/cooper\s*s\b/i.test(normalized)) variant = 'cooper s'
        else if (/john\s*cooper\s*works|jcw/i.test(normalized)) variant = 'jcw'
        else if (/cooper\s*c\b/i.test(normalized)) variant = 'cooper c'
        else if (/cooper/i.test(normalized)) variant = 'cooper'
      }
    }
    else if (/\b(countryman|clubman|paceman)\b/.test(normalized)) {
      const match = normalized.match(/\b(countryman|clubman|paceman)\s*([sd]|jcw|cooper)?/i)
      if (match) {
        base = `mini ${match[1]}`
        variant = match[2] || ''
      }
    }
    else if (/aceman/.test(normalized)) {
      base = 'mini aceman'
      if (/aceman\s*se/.test(normalized)) variant = 'se'
      else if (/aceman\s*e\b/.test(normalized)) variant = 'e'
    }
    else if (/cabrio/.test(normalized)) {
      base = 'mini cabrio'
      variant = ''
    }
    else if (/cooper/.test(normalized)) {
      base = 'mini cooper'
      if (/cooper\s*se/.test(normalized)) variant = 'se'
      else if (/cooper\s*s\b/.test(normalized)) variant = 's'
      else if (/john\s*cooper\s*works|jcw/.test(normalized)) variant = 'jcw'
      else variant = ''
    }
  }
  
  if (!base && normalized.length > 0) {
    base = normalized
  }
  
  return { base, variant: variant.toLowerCase() }
}

// Tests
const tests = [
  'BMW Serie 2 218d Gran Coupe',
  'BMW Srie 2 218d Gran Coupe',
  'BMW Serie 3 320d',
  'BMW Serie 3 320d Touring',
  'BMW i4 eDrive40',
  'BMW i4',
  'BMW i7 xDrive60',
  'BMW iX xDrive40',
  'BMW iX1 xDrive30',
  'BMW iX1 eDrive20',
  'BMW iX2 eDrive20',
  'BMW iX3 M Sport',
  'BMW X3 xDrive20d',
  'MINI 3 Puertas',
  'MINI 3 Puertas Cooper SE',
  'MINI Cooper Countryman',
  'MINI Aceman SE'
]

console.log('🧪 Tests de Normalización:\n')
tests.forEach(modelo => {
  const result = normalizeModel(modelo)
  console.log(`${modelo}`)
  console.log(`  → Base: "${result.base}", Variante: "${result.variant}"`)
  console.log('')
})

