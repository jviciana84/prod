export function extractDataFromText(text: string) {
  // Lista actualizada de campos a extraer (incluyendo los nuevos)
  const fieldsToExtract = [
    "BANCO",
    "Comercial",
    "TOTAL",
    "Nº DE MATRÍCULA",
    "PROVINCIA",
    "C.P.",
    "CIUDAD",
    "EMAIL",
    "TFNO. PARTICULAR",
    "D.N.I. Ó N.I.F.",
    "DOMICILIO",
    "PORTAL ORIGEN",
    "NOMBRE Y APELLIDOS O EMPRESA",
    "FECHA DE PEDIDO",
    "Nº BASTIDOR",
    "MODELO",
    "DESCUENTO",
    "Nº PEDIDO",
    // Nuevos campos
    "MARCA",
    "COLOR",
    "KILÓMETROS",
    "PRIMERA FECHA MATRICULACIÓN",
  ]

  const fields: Record<string, string> = {}

  // Inicializar todos los campos como vacíos
  fieldsToExtract.forEach((field) => {
    fields[field] = ""
  })

  // Patrones mejorados para extraer cada campo
  const patterns: Record<string, RegExp> = {
    // Patrones existentes
    BANCO:
      /(?:BANCO|FINANCIACIÓN|ENTIDAD FINANCIERA)[:\s]*([A-Z\s\d]+?)(?=\s*(?:SELECT|TIPO|PERMANENCIA|CUOTA|PLAZO|ENTRADA|$|\n|\r))/i,
    Comercial: /Comercial:\s*([A-Za-zÀ-ÿ\s]+?)(?=\s+AUTOMÓVIL|$)/i,
    TOTAL: /TOTAL\s*([\d.,]+)\s*EUROS/i,
    "Nº DE MATRÍCULA": /N[°º]\s*DE\s*MATRÍCULA\s*([A-Z0-9]+(?:-[A-Z0-9]+)?)/i,
    PROVINCIA: /PROVINCIA\s*([A-Za-z\s]+?)(?=\s*TFNO|$)/i,
    "C.P.": /C\.P\.\s*(\d{5})/i,
    // PATRÓN MEJORADO PARA CIUDAD - Acepta guiones, espacios y caracteres especiales
    CIUDAD: /CIUDAD\s*([A-Za-zÀ-ÿ\s\-.]+?)(?=\s*C\.P\.|\s*PROVINCIA|\s*TFNO|$|\n|\r)/i,
    // PATRÓN MEJORADO PARA EMAIL - Más flexible
    EMAIL: /(?:EMAIL\s*)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    "TFNO. PARTICULAR": /TFNO\.\s*PARTICULAR\s*(\+34\d{9}|\d{9})/i,
    "D.N.I. Ó N.I.F.": /D\.N\.I\.\s*(?:[ÓO]\s*N\.I\.F\.\s*)?([A-Z0-9][A-Z0-9-]{6,10}[A-Z0-9]?)/i,
    DOMICILIO: /DOMICILIO\s*([A-ZÀ-ÿ0-9\s.,]+?)(?=\s+TFNO\.|$)/i,
    "PORTAL ORIGEN": /PORTAL\s*ORIGEN\s*([A-Za-zÀ-ÿ\s]+?)(?=\s+DOMICILIO|$)/i,
    "NOMBRE Y APELLIDOS O EMPRESA": /NOMBRE\s*Y\s*APELLIDOS\s*O\s*EMPRESA\s*([A-ZÀ-ÿ\s]+?)(?=\s+D\.N\.I\.|$)/i,
    "FECHA DE PEDIDO": /FECHA\s*DE\s*PEDIDO\s*(\d{2}[-/]\d{2}[-/]\d{4}|\w+\s+\d{1,2}\s+de\s+\w+\s+del\s+\d{4})/i,
    "Nº BASTIDOR": /N[°º]\s*BASTIDOR\s*([A-Z0-9]{17})/i,
    // PATRÓN MEJORADO PARA MODELO - Más flexible para capturar modelos completos
    MODELO: /MODELO\s*(BMW\s+[^\n\r]+?)(?=\s*\d{2,3}\s*KW|\s*\d{2,3}\s*kW|\s*KILÓMETROS|\s*COLOR|$|\n|\r)/i,
    DESCUENTO: /OTROS\s+GASTOS\s*-\s*SUBTOTAL\s*([-\d.,]+)/i,
    "Nº PEDIDO": /N[°º]\s*PEDIDO\s*([A-Z0-9]+)/i,

    // Nuevos patrones
    COLOR: /COLOR\s*([A-Za-z\s]+?)(?=\s*TAPICERÍA|\s*EQUIPO|\s*SUBTOTAL|$|\n|\r)/i,
    KILÓMETROS: /KILÓMETROS\s*([\d.,]+)/i,
    "PRIMERA FECHA MATRICULACIÓN": /N[°º]\s*COM\s*(\d{2}\s*\/\s*\d{2}\s*\/\s*\d{4})/i,
  }

  // Extraer cada campo usando su patrón
  Object.entries(patterns).forEach(([fieldName, pattern]) => {
    const match = text.match(pattern)
    if (match) {
      const value = match[1] || match[2] || ""
      fields[fieldName] = value.trim()
    }
  })

  // Lógica especial para determinar la MARCA basada en el MODELO
  if (fields["MODELO"]) {
    const modelo = fields["MODELO"].toUpperCase()
    if (modelo.includes("BMW")) {
      // Verificar si es una moto BMW
      if (
        modelo.includes("MOTORRAD") ||
        modelo.includes("R 1250") ||
        modelo.includes("S 1000") ||
        modelo.includes("F 750") ||
        modelo.includes("F 850") ||
        modelo.includes("C 400") ||
        modelo.includes("CE 04")
      ) {
        fields["MARCA"] = "BMW Motorrad"
      } else {
        fields["MARCA"] = "BMW"
      }
    } else if (modelo.includes("MINI")) {
      fields["MARCA"] = "MINI"
    } else {
      // Si no se puede determinar del modelo, intentar buscar en el texto general
      if (text.toUpperCase().includes("BMW MOTORRAD")) {
        fields["MARCA"] = "BMW Motorrad"
      } else if (text.toUpperCase().includes("BMW")) {
        fields["MARCA"] = "BMW"
      } else if (text.toUpperCase().includes("MINI")) {
        fields["MARCA"] = "MINI"
      } else {
        fields["MARCA"] = "BMW" // Por defecto BMW
      }
    }
  } else {
    // Si no hay modelo, buscar marca directamente en el texto
    if (text.toUpperCase().includes("BMW MOTORRAD")) {
      fields["MARCA"] = "BMW Motorrad"
    } else if (text.toUpperCase().includes("MINI")) {
      fields["MARCA"] = "MINI"
    } else {
      fields["MARCA"] = "BMW" // Por defecto BMW
    }
  }

  // Patrones alternativos para BANCO si no se encontró con el patrón principal
  if (!fields["BANCO"] || fields["BANCO"] === "") {
    // Buscar patrones específicos de financiación - MEJORADO para detectar FINANCIADA/FINANCIADO
    const bankPatterns = [
      /BMW\s*BANK/i,
      /BMW\s*FINANCIAL\s*SERVICES/i,
      /SELECT/i,
      /LINEAL/i,
      /BALLOON/i,
      /TRIPLE\s*0/i,
      /FINANCIAD[AO]/i, // NUEVO: detecta FINANCIADA y FINANCIADO
      /FINANCIACI[ÓO]N/i,
      /BBVA/i,
      /CAIXABANK/i,
      /SANTANDER/i,
      /SABADELL/i,
      /BANKINTER/i,
      /ING/i,
      /CONTADO/i,
      /EFECTIVO/i,
    ]

    for (const pattern of bankPatterns) {
      const match = text.match(pattern)
      if (match) {
        fields["BANCO"] = match[0].trim()
        break
      }
    }
  }

  // Patrones alternativos para MODELO si no se encontró con el patrón principal
  if (!fields["MODELO"] || fields["MODELO"] === "") {
    // Buscar patrón alternativo más amplio
    const modeloAlternativo = text.match(/MODELO\s*([^\n\r]+)/i)
    if (modeloAlternativo) {
      fields["MODELO"] = modeloAlternativo[1].trim()
    }
  }

  // Patrones alternativos para CIUDAD si no se encontró
  if (!fields["CIUDAD"] || fields["CIUDAD"] === "") {
    // Buscar después de CIUDAD con patrón más flexible
    const ciudadAlternativa = text.match(/CIUDAD\s*([^\n\r\t]+?)(?=\s*C\.P\.|\s*PROVINCIA|\s*\d{5}|$)/i)
    if (ciudadAlternativa) {
      fields["CIUDAD"] = ciudadAlternativa[1].trim()
    }
  }

  // MEJORADO: Buscar email en todo el texto si no se encontró
  if (!fields["EMAIL"] || fields["EMAIL"] === "") {
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (emailMatch) {
      fields["EMAIL"] = emailMatch[1].trim()
    }
  }

  if (!fields["TFNO. PARTICULAR"] || fields["TFNO. PARTICULAR"] === "") {
    const phoneMatch = text.match(/(?:\+34\s*)?(\d{9})/i)
    if (phoneMatch) {
      fields["TFNO. PARTICULAR"] = phoneMatch[1].trim()
    }
  }

  // Post-procesamiento para limpiar y corregir valores
  Object.keys(fields).forEach((fieldName) => {
    const value = fields[fieldName]

    if (fieldName === "Nº DE MATRÍCULA" && value) {
      fields[fieldName] = value.replace(/-/g, "")
    }

    if (fieldName === "D.N.I. Ó N.I.F." && value) {
      // Limpiar el CIF/DNI/NIF para quitar espacios internos y guiones.
      const cleanedDniNif = value.replace(/[\s-]/g, "")
      fields[fieldName] = cleanedDniNif.toUpperCase()
    }

    if (fieldName === "CIUDAD" && value) {
      // Limpiar la ciudad - remover espacios extra y caracteres no deseados al final
      let cleanedCity = value.replace(/\s*c\s*$/i, "").trim()
      // Remover caracteres extraños al final
      cleanedCity = cleanedCity.replace(/[^\w\s\-.À-ÿ]/g, "").trim()
      fields[fieldName] = cleanedCity
    }

    if (fieldName === "MODELO" && value) {
      // Limpiar el modelo - remover especificaciones de potencia al final Y LA MARCA
      let cleanedModel = value.trim()

      // 1. Remover prefijo de marca BMW/MINI
      if (cleanedModel.toUpperCase().startsWith("BMW ")) {
        cleanedModel = cleanedModel.substring(4).trim()
      } else if (cleanedModel.toUpperCase().startsWith("MINI ")) {
        cleanedModel = cleanedModel.substring(5).trim()
      }

      // 2. Remover especificaciones de potencia que aparecen al final
      cleanedModel = cleanedModel.replace(/\s+\d{2,3}\s*kW\s*$$\d{2,3}\s*CV$$.*$/i, "")
      cleanedModel = cleanedModel.replace(/\s+\d{2,3}\s*KW\s*$$\d{2,3}\s*CV$$.*$/i, "")

      fields[fieldName] = cleanedModel.trim()
    }

    if (fieldName === "COLOR" && value) {
      // Limpiar y normalizar el color
      const cleanedColor = value.trim()
      // Capitalizar primera letra
      fields[fieldName] = cleanedColor.charAt(0).toUpperCase() + cleanedColor.slice(1).toLowerCase()
    }

    if (fieldName === "KILÓMETROS" && value) {
      // Limpiar kilómetros - remover puntos y comas de miles
      const cleanedKm = value.replace(/[.,]/g, "")
      fields[fieldName] = cleanedKm
    }

    if (fieldName === "PRIMERA FECHA MATRICULACIÓN" && value) {
      // Normalizar formato de fecha DD/MM/YYYY
      const cleanedDate = value.replace(/\s/g, "")
      if (cleanedDate.match(/\d{2}\/\d{2}\/\d{4}/)) {
        fields[fieldName] = cleanedDate
      }
    }

    if (fieldName === "BANCO") {
      // Limpiar y normalizar el campo BANCO
      const cleanedBank = value ? value.replace(/^BANCO\s*/i, "").trim() : ""

      // LÓGICA SIMPLE:
      // 1. Si está VACÍO → CONTADO
      // 2. Si dice "CONTADO" o "EFECTIVO" → CONTADO
      // 3. TODO LO DEMÁS (incluido "FINANCIACIÓN") → FINANCIADO
      
      if (!cleanedBank || cleanedBank === "") {
        fields[fieldName] = "CONTADO"
      } else if (cleanedBank.toLowerCase().includes("contado") || cleanedBank.toLowerCase().includes("efectivo")) {
        fields[fieldName] = "CONTADO"
      } else {
        // TODO lo demás es financiación (FINANCIACIÓN, BMW BANK, BBVA, etc.)
        fields[fieldName] = "FINANCIADO"
      }
    }

    if (fieldName === "FECHA DE PEDIDO" && value) {
      if (value.match(/\w+\s+\d{1,2}\s+de\s+\w+\s+del\s+(\d{4})/i)) {
        // Formato "Jueves 15 de Mayo del 2025"
        const months: Record<string, string> = {
          enero: "01",
          febrero: "02",
          marzo: "03",
          abril: "04",
          mayo: "05",
          junio: "06",
          julio: "07",
          agosto: "08",
          septiembre: "09",
          octubre: "10",
          noviembre: "11",
          diciembre: "12",
        }
        const dateMatch = value.match(/(\d{1,2})\s+de\s+(\w+)\s+del\s+(\d{4})/i)
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, "0")
          const monthName = dateMatch[2].toLowerCase()
          const year = dateMatch[3]
          const month = months[monthName] || "01"
          fields[fieldName] = `${day}/${month}/${year}`
        }
      } else if (value.includes("/")) {
        // Formato DD/MM/YYYY
        const parts = value.split("/")
        if (parts.length === 3) {
          fields[fieldName] = `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`
        }
      } else if (value.includes("-")) {
        // Formato DD-MM-YYYY o YYYY-MM-DD
        const dateParts = value.split("-")
        if (dateParts.length === 3) {
          if (dateParts[0].length === 4) {
            // YYYY-MM-DD
            fields[fieldName] = `${dateParts[2].padStart(2, "0")}/${dateParts[1].padStart(2, "0")}/${dateParts[0]}`
          } else {
            // DD-MM-YYYY
            fields[fieldName] = `${dateParts[0].padStart(2, "0")}/${dateParts[1].padStart(2, "0")}/${dateParts[2]}`
          }
        }
      }
    }
  })

  return fields
}
