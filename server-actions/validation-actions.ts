"use server"

import { createServerActionClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

/**
 * Sincroniza un vehículo entre las tablas sales_vehicles y pedidos_validados
 * transfiriendo TODOS los datos cuando se valida o desvalida un vehículo
 */
export async function syncValidatedVehicle(vehicleId: string, isValidated: boolean) {
  console.log(`[SERVER] syncValidatedVehicle iniciado: vehicleId=${vehicleId}, isValidated=${isValidated}`)

  try {
    const cookieStore = await cookies()
    const supabase = await createServerActionClient(cookieStore)

    // Si el vehículo está siendo validado, necesitamos copiarlo a la tabla pedidos_validados
    if (isValidated) {
      console.log("[SERVER] Vehículo validado, obteniendo TODOS los datos...")

      // Obtener TODOS los datos del vehículo de la tabla sales_vehicles
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("sales_vehicles")
        .select("*")
        .eq("id", vehicleId)
        .single()

      if (vehicleError) {
        console.error("[SERVER] Error al obtener datos del vehículo:", vehicleError)
        return { success: false, error: vehicleError.message }
      }

      if (!vehicleData) {
        console.error("[SERVER] No se encontró el vehículo con ID:", vehicleId)
        return { success: false, error: "No se encontró el vehículo" }
      }

      console.log("[SERVER] Datos del vehículo obtenidos:", Object.keys(vehicleData))

      // Verificar si ya existe un registro en pedidos_validados para este vehículo
      const { data: existingValidation, error: existingError } = await supabase
        .from("pedidos_validados")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .maybeSingle()

      if (existingError) {
        console.error("[SERVER] Error al verificar validación existente:", existingError)
        return { success: false, error: existingError.message }
      }

      // Preparar TODOS los datos para insertar/actualizar en pedidos_validados
      const now = new Date().toISOString()
      const validationData = {
        // Referencia al vehículo original
        vehicle_id: vehicleId,

        // Campos básicos (copiados exactamente de sales_vehicles)
        license_plate: vehicleData.license_plate || "",
        model: vehicleData.model || "Sin modelo",
        vehicle_type: vehicleData.vehicle_type || null,
        stock_id: vehicleData.stock_id || null,
        sale_date: vehicleData.sale_date || null,
        advisor: vehicleData.advisor || "",
        price: vehicleData.price || null,
        payment_method: vehicleData.payment_method || "Contado",
        payment_status: vehicleData.payment_status || "pendiente",
        or_value: vehicleData.or_value || null,
        expense_charge: vehicleData.expense_charge || null,
        cyp_status: vehicleData.cyp_status || "pendiente",
        cyp_date: vehicleData.cyp_date || null,
        photo_360_status: vehicleData.photo_360_status || "pendiente",
        photo_360_date: vehicleData.photo_360_date || null,
        validated: true, // Siempre true porque estamos validando
        validation_date: now, // Fecha actual de validación
        appraised: vehicleData.appraised || false,
        appraisal_date: vehicleData.appraisal_date || null,
        delivery_center: vehicleData.delivery_center || null,
        external_provider: vehicleData.external_provider || null,
        advisor_name: vehicleData.advisor_name || null,
        advisor_id: vehicleData.advisor_id || null,
        document_type: vehicleData.document_type || null,
        client_name: vehicleData.client_name || null,
        client_dni: vehicleData.client_dni || null,
        client_address: vehicleData.client_address || null,
        client_phone: vehicleData.client_phone || null,
        client_email: vehicleData.client_email || null,
        vin: vehicleData.vin || null,
        brand: vehicleData.brand || null,
        color: vehicleData.color || null,
        registration_date: vehicleData.registration_date || null,
        mileage: vehicleData.mileage || null,
        bank: vehicleData.bank || null,
        origin_portal: vehicleData.origin_portal || null,
        purchase_price: vehicleData.purchase_price || null,
        pdf_extraction_id: vehicleData.pdf_extraction_id || null,
        pdf_url: vehicleData.pdf_url || null,
        extraction_date: vehicleData.extraction_date || null,
        is_duplicate: vehicleData.is_duplicate || false,
        duplicate_reference_id: vehicleData.duplicate_reference_id || null,
        is_resale: vehicleData.is_resale || false,

        // Campos adicionales específicos de validación
        status: "Validado",
        observations: "",

        // Fechas de control
        created_at: vehicleData.created_at || now,
        updated_at: now,
      }

      console.log("[SERVER] Datos preparados para sincronización con", Object.keys(validationData).length, "campos")

      // Si ya existe, actualizamos; si no, insertamos
      if (existingValidation) {
        console.log("[SERVER] Actualizando registro existente...")
        const { error: updateError } = await supabase
          .from("pedidos_validados")
          .update(validationData)
          .eq("id", existingValidation.id)

        if (updateError) {
          console.error("[SERVER] Error al actualizar validación:", updateError)
          return { success: false, error: updateError.message }
        }

        console.log("[SERVER] Registro actualizado correctamente")
      } else {
        console.log("[SERVER] Insertando nuevo registro...")
        const { error: insertError } = await supabase.from("pedidos_validados").insert(validationData)

        if (insertError) {
          console.error("[SERVER] Error al insertar validación:", insertError)
          return { success: false, error: insertError.message }
        }

        console.log("[SERVER] Registro insertado correctamente")
      }
    } else {
      // Si el vehículo está siendo desvalidado, eliminamos el registro de pedidos_validados
      console.log("[SERVER] Vehículo desvalidado, eliminando registro...")

      const { error: deleteError } = await supabase.from("pedidos_validados").delete().eq("vehicle_id", vehicleId)

      if (deleteError) {
        console.error("[SERVER] Error al eliminar validación:", deleteError)
        return { success: false, error: deleteError.message }
      }

      console.log("[SERVER] Registro eliminado correctamente")
    }

    // Revalidamos las rutas para actualizar los datos
    revalidatePath("/dashboard/validados")
    revalidatePath("/dashboard/ventas")

    console.log("[SERVER] syncValidatedVehicle completado con éxito")
    return { success: true }
  } catch (error) {
    console.error("[SERVER] Error inesperado en syncValidatedVehicle:", error)
    return { success: false, error: `Error interno del servidor: ${error.message}` }
  }
}

/**
 * Sincroniza los cambios de un vehículo en sales_vehicles a pedidos_validados
 * cuando se actualiza un vehículo que ya está validado
 */
export async function syncUpdatedVehicle(vehicleId: string) {
  console.log(`[SERVER] syncUpdatedVehicle iniciado: vehicleId=${vehicleId}`)

  try {
    const cookieStore = await cookies()
    const supabase = await createServerActionClient(cookieStore)

    // Verificar si el vehículo está validado
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("sales_vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single()

    if (vehicleError) {
      console.error("[SERVER] Error al obtener datos del vehículo:", vehicleError)
      return { success: false, error: vehicleError.message }
    }

    if (!vehicleData) {
      console.error("[SERVER] No se encontró el vehículo con ID:", vehicleId)
      return { success: false, error: "No se encontró el vehículo" }
    }

    // Si el vehículo está validado, actualizar en pedidos_validados
    if (vehicleData.validated) {
      console.log("[SERVER] Vehículo validado, actualizando en pedidos_validados...")

      // Verificar si existe en pedidos_validados
      const { data: existingValidation, error: existingError } = await supabase
        .from("pedidos_validados")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .maybeSingle()

      if (existingError) {
        console.error("[SERVER] Error al verificar validación existente:", existingError)
        return { success: false, error: existingError.message }
      }

      if (!existingValidation) {
        console.log("[SERVER] No existe registro en pedidos_validados, creando uno nuevo...")
        // Si no existe, llamar a syncValidatedVehicle para crear el registro
        return await syncValidatedVehicle(vehicleId, true)
      }

      // Preparar datos para actualizar
      const now = new Date().toISOString()
      const updateData = {
        license_plate: vehicleData.license_plate || "",
        model: vehicleData.model || "Sin modelo",
        vehicle_type: vehicleData.vehicle_type || null,
        stock_id: vehicleData.stock_id || null,
        sale_date: vehicleData.sale_date || null,
        advisor: vehicleData.advisor || "",
        price: vehicleData.price || null,
        payment_method: vehicleData.payment_method || "Contado",
        payment_status: vehicleData.payment_status || "pendiente",
        or_value: vehicleData.or_value || null,
        expense_charge: vehicleData.expense_charge || null,
        cyp_status: vehicleData.cyp_status || "pendiente",
        cyp_date: vehicleData.cyp_date || null,
        photo_360_status: vehicleData.photo_360_status || "pendiente",
        photo_360_date: vehicleData.photo_360_date || null,
        appraised: vehicleData.appraised || false,
        appraisal_date: vehicleData.appraisal_date || null,
        delivery_center: vehicleData.delivery_center || null,
        external_provider: vehicleData.external_provider || null,
        advisor_name: vehicleData.advisor_name || null,
        advisor_id: vehicleData.advisor_id || null,
        document_type: vehicleData.document_type || null,
        client_name: vehicleData.client_name || null,
        client_dni: vehicleData.client_dni || null,
        client_address: vehicleData.client_address || null,
        client_phone: vehicleData.client_phone || null,
        client_email: vehicleData.client_email || null,
        vin: vehicleData.vin || null,
        brand: vehicleData.brand || null,
        color: vehicleData.color || null,
        registration_date: vehicleData.registration_date || null,
        mileage: vehicleData.mileage || null,
        bank: vehicleData.bank || null,
        origin_portal: vehicleData.origin_portal || null,
        purchase_price: vehicleData.purchase_price || null,
        pdf_extraction_id: vehicleData.pdf_extraction_id || null,
        pdf_url: vehicleData.pdf_url || null,
        extraction_date: vehicleData.extraction_date || null,
        is_duplicate: vehicleData.is_duplicate || false,
        duplicate_reference_id: vehicleData.duplicate_reference_id || null,
        is_resale: vehicleData.is_resale || false,
        updated_at: now,
      }

      console.log("[SERVER] Actualizando registro en pedidos_validados...")
      const { error: updateError } = await supabase
        .from("pedidos_validados")
        .update(updateData)
        .eq("id", existingValidation.id)

      if (updateError) {
        console.error("[SERVER] Error al actualizar validación:", updateError)
        return { success: false, error: updateError.message }
      }

      console.log("[SERVER] Registro actualizado correctamente en pedidos_validados")
    } else {
      console.log("[SERVER] Vehículo no validado, no es necesario actualizar pedidos_validados")
    }

    // Revalidamos las rutas para actualizar los datos
    revalidatePath("/dashboard/validados")
    revalidatePath("/dashboard/ventas")

    console.log("[SERVER] syncUpdatedVehicle completado con éxito")
    return { success: true }
  } catch (error) {
    console.error("[SERVER] Error inesperado en syncUpdatedVehicle:", error)
    return { success: false, error: `Error interno del servidor: ${error.message}` }
  }
}
