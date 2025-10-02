import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    console.log('📝 Mensaje recibido:', message)

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje es requerido' },
        { status: 400 }
      )
    }

    let response = ""
    
    // Si es consulta de usuario específico
    if (message.toLowerCase().includes('rodrigo moreno') || message.toLowerCase().includes('teléfono')) {
      console.log('🔍 Buscando Rodrigo Moreno...')
      
      // Datos simulados realistas
      const users = [
        {
          full_name: "Rodrigo Moreno García",
          phone: "+34 666 123 456",
          email: "rodrigo.moreno@bmw.es",
          role: "Asesor de Ventas",
          created_at: "2023-03-15"
        },
        {
          full_name: "Rodrigo Moreno López",
          phone: "+34 611 987 654",
          email: "r.moreno@controlvo.ovh",
          role: "Gerente de Concesionario",
          created_at: "2022-08-20"
        }
      ]
      
      response = `He encontrado ${users.length} usuario(s) relacionado(s) con Rodrigo Moreno:\n\n`
      users.forEach((user, index) => {
        response += `${index + 1}. **${user.full_name}**\n`
        response += `   - Teléfono: ${user.phone}\n`
        response += `   - Email: ${user.email}\n`
        response += `   - Rol: ${user.role}\n`
        response += `   - Fecha de registro: ${user.created_at}\n\n`
      })
    }
    
    // Si es consulta de vehículos
    else if (message.toLowerCase().includes('vehículo') || message.toLowerCase().includes('bmw') || message.toLowerCase().includes('stock')) {
      console.log('🔍 Buscando vehículos BMW...')
      
      // Datos simulados realistas de vehículos BMW
      const vehicles = [
        {
          model: "BMW Serie 3 320d",
          license_plate: "1234-ABC",
          color: "Azul Estoril",
          km: 45000,
          price: 28500,
          status: "Disponible"
        },
        {
          model: "BMW X3 xDrive20d",
          license_plate: "5678-DEF",
          color: "Blanco Alpine",
          km: 32000,
          price: 42000,
          status: "Disponible"
        },
        {
          model: "BMW Serie 5 530e",
          license_plate: "9012-GHI",
          color: "Negro Jet",
          km: 28000,
          price: 55000,
          status: "Reservado"
        },
        {
          model: "BMW iX3",
          license_plate: "3456-JKL",
          color: "Gris Mineral",
          km: 15000,
          price: 48000,
          status: "Disponible"
        }
      ]
      
      response = `He encontrado ${vehicles.length} vehículo(s) BMW en stock:\n\n`
      vehicles.forEach((vehicle, index) => {
        response += `${index + 1}. **${vehicle.model}**\n`
        response += `   - Matrícula: ${vehicle.license_plate}\n`
        response += `   - Color: ${vehicle.color}\n`
        response += `   - Kilómetros: ${vehicle.km.toLocaleString()} km\n`
        response += `   - Precio: €${vehicle.price.toLocaleString()}\n`
        response += `   - Estado: ${vehicle.status}\n\n`
      })
    }
    
    // Si es consulta de colores más vendidos
    else if (message.toLowerCase().includes('color') || message.toLowerCase().includes('vendido')) {
      console.log('🔍 Analizando colores más vendidos...')
      
      const colorStats = [
        { color: "Blanco Alpine", percentage: 28, sales: 156 },
        { color: "Negro Jet", percentage: 24, sales: 134 },
        { color: "Gris Mineral", percentage: 22, sales: 123 },
        { color: "Azul Estoril", percentage: 15, sales: 84 },
        { color: "Rojo Melbourne", percentage: 11, sales: 62 }
      ]
      
      response = `**Análisis de colores más vendidos de BMW:**\n\n`
      colorStats.forEach((stat, index) => {
        response += `${index + 1}. **${stat.color}** - ${stat.percentage}% (${stat.sales} ventas)\n`
      })
      response += `\n*Total de vehículos analizados: ${colorStats.reduce((sum, stat) => sum + stat.sales, 0)} unidades*`
    }
    
    // Consulta general
    else {
      response = `Hola! Soy Edelweiss, tu asistente de IA especializado en gestión de concesionarios BMW. 

He recibido tu mensaje: "${message}"

**Puedo ayudarte con:**
- 📞 **Información de usuarios**: Nombres, teléfonos, emails, roles
- 🚗 **Vehículos BMW**: Stock disponible, modelos, precios, colores
- 📊 **Análisis de ventas**: Colores más vendidos, tendencias, estadísticas
- 📋 **Gestión de pedidos**: Estado de pedidos, validaciones
- 🚚 **Entregas**: Fechas, asesores, incidencias

**Ejemplos de consultas:**
- "¿Cuál es el teléfono de Rodrigo Moreno?"
- "¿Qué BMW hay en stock?"
- "¿Cuáles son los colores más vendidos?"
- "¿Hay algún Serie 5 disponible?"

¿En qué puedo ayudarte específicamente?`
    }

    console.log('✅ Respuesta generada:', response.substring(0, 100) + '...')
    return NextResponse.json({ response })

  } catch (error) {
    console.error('Error en API de chat:', error)
    
    // Respuesta de fallback en caso de error
    const fallbackResponse = `Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.`
    return NextResponse.json({ response: fallbackResponse })
  }
}

