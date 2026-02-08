const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan variables de entorno')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function ejecutarSQL() {
  console.log('\n🔧 AÑADIENDO CAMPOS DE ANÁLISIS AVANZADO A EXCEL\n')
  console.log('='.repeat(80))

  try {
    const sqlPath = path.join(__dirname, '..', 'sql', 'add_campos_analisis_avanzado_excel.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📝 Ejecutando SQL desde:', sqlPath)
    console.log('-'.repeat(80))

    // Dividir el SQL en comandos individuales
    const comandos = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'))

    console.log(`📊 Ejecutando ${comandos.length} comandos ALTER TABLE...\n`)

    // Ejecutar cada comando ALTER TABLE por separado
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i]
      if (comando.includes('ALTER TABLE')) {
        console.log(`   [${i + 1}/${comandos.length}] Ejecutando ALTER TABLE...`)
        
        // Ejecutar usando rpc si está disponible, sino intentar directamente
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: comando + ';'
        })

        if (error) {
          // Si no existe exec_sql, intentar ejecutar cada ALTER TABLE directamente
          // Parsear el comando para extraer los campos
          const match = comando.match(/ALTER TABLE\s+(\w+)\s+ADD COLUMN IF NOT EXISTS\s+(\w+)\s+(\w+(?:\([^)]+\))?)/gi)
          
          if (match) {
            // Intentar ejecutar cada ADD COLUMN por separado
            const addColumns = comando.match(/ADD COLUMN IF NOT EXISTS\s+\w+\s+\w+(?:\([^)]+\))?(?:,\s*--[^\n]*)?/gi) || []
            
            for (const addCol of addColumns) {
              const colMatch = addCol.match(/ADD COLUMN IF NOT EXISTS\s+(\w+)\s+(\w+(?:\([^)]+\))?)/i)
              if (colMatch) {
                const colName = colMatch[1]
                const colType = colMatch[2]
                const alterCmd = `ALTER TABLE vehiculos_excel_comparador ADD COLUMN IF NOT EXISTS ${colName} ${colType};`
                
                // Intentar ejecutar directamente (puede fallar si no hay función RPC)
                try {
                  await supabase.rpc('exec_sql', { sql_query: alterCmd })
                  console.log(`      ✅ Campo ${colName} añadido`)
                } catch (e) {
                  console.log(`      ⚠️  No se puede ejecutar directamente. Ejecuta manualmente en Supabase SQL Editor`)
                }
              }
            }
          }
        } else {
          console.log(`      ✅ Comando ejecutado correctamente`)
        }
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Script SQL procesado')
    console.log('')
    console.log('⚠️  NOTA: Si algunos campos no se añadieron, ejecuta manualmente en Supabase:')
    console.log('   1. Ve a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
    console.log('   2. Copia y pega el contenido de: sql/add_campos_analisis_avanzado_excel.sql')
    console.log('   3. Click en "Run"')
    console.log('')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.log('')
    console.log('💡 Por favor, ejecuta MANUALMENTE en Supabase SQL Editor:')
    console.log('='.repeat(80))
    console.log('')
    console.log('1. Ve a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
    console.log('2. Copia y pega el contenido de: sql/add_campos_analisis_avanzado_excel.sql')
    console.log('3. Click en "Run"')
    console.log('')
    console.log('='.repeat(80))
    process.exit(1)
  }
}

ejecutarSQL()


