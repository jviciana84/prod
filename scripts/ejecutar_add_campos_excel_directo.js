const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Lista de campos a añadir
const campos = [
  { nombre: 'gama', tipo: 'TEXT', comentario: 'Gama del vehículo: básica, media o alta' },
  { nombre: 'equipamiento', tipo: 'TEXT', comentario: 'Nivel de equipamiento: básico, medio o premium' },
  { nombre: 'valor_teorico_esperado', tipo: 'NUMERIC(10, 2)', comentario: 'Valor teórico esperado según depreciación por antigüedad y KM' },
  { nombre: 'precio_percentil25_competencia', tipo: 'NUMERIC(10, 2)', comentario: 'Percentil 25 de precios de competencia' },
  { nombre: 'precio_percentil75_competencia', tipo: 'NUMERIC(10, 2)', comentario: 'Percentil 75 de precios de competencia' },
  { nombre: 'precio_minimo_competencia', tipo: 'NUMERIC(10, 2)', comentario: 'Precio mínimo de competencia' },
  { nombre: 'precio_maximo_competencia', tipo: 'NUMERIC(10, 2)', comentario: 'Precio máximo de competencia' },
  { nombre: 'km_medio_competencia', tipo: 'INTEGER', comentario: 'Kilometraje medio de competencia' },
  { nombre: 'promedio_anio_competencia', tipo: 'NUMERIC(4, 1)', comentario: 'Año promedio de competencia' },
  { nombre: 'descuento_minimo_requerido', tipo: 'NUMERIC(5, 2)', comentario: 'Descuento mínimo requerido si hay competidores estancados' },
  { nombre: 'max_descuento_zombie', tipo: 'NUMERIC(5, 2)', comentario: 'Máximo descuento rechazado por competidores estancados' },
  { nombre: 'competidores_estancados', tipo: 'INTEGER', comentario: 'Cantidad de competidores estancados (>60 días)' },
  { nombre: 'score_competitividad', tipo: 'INTEGER', comentario: 'Score de competitividad (0-100)' },
  { nombre: 'nivel_competitividad', tipo: 'TEXT', comentario: 'Nivel de competitividad: excelente, bueno, justo, alto, muy_alto' },
  { nombre: 'posicion_percentil', tipo: 'INTEGER', comentario: 'Posición en el mercado (0-100)' },
  { nombre: 'confianza_analisis', tipo: 'TEXT', comentario: 'Nivel de confianza en el análisis: alta, media, baja' },
  { nombre: 'precio_recomendado_avanzado', tipo: 'NUMERIC(10, 2)', comentario: 'Precio recomendado usando metodología avanzada' },
  { nombre: 'diferencia_ajustada', tipo: 'NUMERIC(10, 2)', comentario: 'Diferencia vs precio ajustado por KM' },
  { nombre: 'porcentaje_dif_ajustado', tipo: 'NUMERIC(5, 2)', comentario: 'Porcentaje diferencia vs ajustado' },
  { nombre: 'metodo_precio_base', tipo: 'TEXT', comentario: 'Método usado para precio base: sin_datos, percentil25, promedio' },
  { nombre: 'recomendacion_texto', tipo: 'TEXT', comentario: 'Texto de recomendación' }
]

async function añadirCampos() {
  console.log('\n🔧 AÑADIENDO CAMPOS DE ANÁLISIS AVANZADO A EXCEL\n')
  console.log('='.repeat(80))

  let añadidos = 0
  let errores = 0

  for (const campo of campos) {
    try {
      // Intentar ejecutar ALTER TABLE usando RPC
      const sql = `ALTER TABLE vehiculos_excel_comparador ADD COLUMN IF NOT EXISTS ${campo.nombre} ${campo.tipo};`
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: sql 
      })

      if (error) {
        // Si no existe exec_sql, el campo se añadirá cuando se ejecute el recálculo
        // o manualmente en Supabase
        console.log(`   ⚠️  ${campo.nombre}: No se puede ejecutar automáticamente`)
        errores++
      } else {
        console.log(`   ✅ ${campo.nombre} añadido`)
        añadidos++
      }
    } catch (error) {
      console.log(`   ⚠️  ${campo.nombre}: ${error.message}`)
      errores++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Procesados: ${campos.length} campos`)
  console.log(`   ✅ Añadidos: ${añadidos}`)
  console.log(`   ⚠️  Requieren ejecución manual: ${errores}`)
  
  if (errores > 0) {
    console.log('\n💡 Para añadir los campos restantes, ejecuta en Supabase SQL Editor:')
    console.log('='.repeat(80))
    console.log('')
    console.log('1. Ve a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
    console.log('2. Copia y pega el contenido de: sql/add_campos_analisis_avanzado_excel.sql')
    console.log('3. Click en "Run"')
    console.log('')
    console.log('='.repeat(80))
  } else {
    console.log('\n✅ Todos los campos añadidos correctamente')
  }
}

añadirCampos().catch(console.error)


