// Script para actualizar datos de incentivos desde las tablas relacionadas
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Variables de entorno de Supabase no configuradas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function actualizarDatosIncentivos() {
  console.log("🚀 Iniciando actualización de datos de incentivos...")

  try {
    // 1. Obtener todos los incentivos
    console.log("📊 Obteniendo incentivos...")
    const { data: incentivos, error: incentivosError } = await supabase.from("incentivos").select("id, matricula")

    if (incentivosError) {
      throw new Error(`Error al obtener incentivos: ${incentivosError.message}`)
    }

    if (!incentivos || incentivos.length === 0) {
      console.log("ℹ️  No hay incentivos para actualizar")
      return
    }

    console.log(`📋 Encontrados ${incentivos.length} incentivos para actualizar`)

    // 2. Actualizar cada incentivo
    let actualizados = 0
    let errores = 0
    const erroresDetalle = []

    for (const incentivo of incentivos) {
      if (!incentivo.matricula) {
        console.log(`⚠️  Saltando incentivo ${incentivo.id} - sin matrícula`)
        continue
      }

      try {
        console.log(`🔄 Procesando ${incentivo.matricula}...`)

        // Obtener datos de nuevas_entradas (precio de compra)
        const { data: nuevaEntrada } = await supabase
          .from("nuevas_entradas")
          .select("purchase_price, purchase_date")
          .eq("license_plate", incentivo.matricula)
          .single()

        // Obtener datos de sales_vehicles (precio de venta)
        const { data: venta } = await supabase
          .from("sales_vehicles")
          .select("price, sale_date, payment_method")
          .eq("license_plate", incentivo.matricula)
          .single()

        // Calcular días de stock
        let diasStock = null
        if (nuevaEntrada?.purchase_date && venta?.sale_date) {
          const purchaseDate = new Date(nuevaEntrada.purchase_date)
          const saleDate = new Date(venta.sale_date)
          diasStock = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
        }

        // Calcular margen
        let margen = 0
        if (venta?.price && nuevaEntrada?.purchase_price) {
          margen = venta.price - nuevaEntrada.purchase_price
        }

        // Actualizar incentivo
        const { error: updateError } = await supabase
          .from("incentivos")
          .update({
            precio_compra: nuevaEntrada?.purchase_price || null,
            precio_venta: venta?.price || null,
            forma_pago: venta?.payment_method || null,
            dias_stock: diasStock,
            margen: margen,
            financiado: venta?.payment_method?.toLowerCase() === "financiado",
            updated_at: new Date().toISOString(),
          })
          .eq("id", incentivo.id)

        if (updateError) {
          throw new Error(`Error al actualizar: ${updateError.message}`)
        }

        actualizados++
        console.log(`✅ ${incentivo.matricula} actualizado correctamente`)
      } catch (error) {
        errores++
        const errorMsg = `❌ Error en ${incentivo.matricula}: ${error.message}`
        console.error(errorMsg)
        erroresDetalle.push(errorMsg)
      }
    }

    // 3. Mostrar resumen
    console.log("\n📊 RESUMEN DE ACTUALIZACIÓN:")
    console.log(`✅ Registros actualizados: ${actualizados}`)
    console.log(`❌ Errores: ${errores}`)

    if (erroresDetalle.length > 0) {
      console.log("\n🔍 DETALLE DE ERRORES:")
      erroresDetalle.forEach((error) => console.log(error))
    }

    console.log("\n🎉 Actualización completada!")
  } catch (error) {
    console.error("💥 Error fatal:", error.message)
    process.exit(1)
  }
}

// Ejecutar el script
actualizarDatosIncentivos()
