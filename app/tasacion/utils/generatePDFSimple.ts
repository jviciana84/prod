'use client'

import type { TasacionFormData } from '@/types/tasacion'

interface GeneratePDFSimpleOptions {
  data: TasacionFormData
  metadata?: {
    ip?: string
    geolocalizacion?: {
      latitude: number
      longitude: number
    }
    dispositivo?: {
      userAgent: string
      platform: string
      idioma: string
    }
    timestamp?: string
  }
  filename?: string
}

export async function generateAndDownloadPDFSimple({ 
  data, 
  metadata, 
  filename = `tasacion_${data.matricula}_${Date.now()}.html` 
}: GeneratePDFSimpleOptions) {
  try {
    console.log('Generando PDF simple con datos:', data)
    
    // Crear contenido HTML
    const htmlContent = generateHTMLContent(data, metadata)
    
    // Crear un blob con el HTML
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    
    // Crear enlace de descarga
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    
    // Limpiar
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('Archivo HTML descargado exitosamente')
    return { success: true, message: 'Archivo descargado correctamente' }
    
  } catch (error) {
    console.error('Error generando archivo:', error)
    return { 
      success: false, 
      message: 'Error al generar el archivo',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

function generateHTMLContent(data: TasacionFormData, metadata?: any): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Tasación - ${data.matricula || 'Vehículo'}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            background: white;
            color: #333;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 20px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            padding: 30px;
            border-radius: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #6d28d9;
            margin: 0;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 30px;
            background: #fafafa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #6d28d9;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e5e7eb;
        }
        .data-row {
            display: flex;
            margin-bottom: 10px;
            padding: 8px;
            background: white;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .label {
            font-weight: bold;
            color: #374151;
            width: 180px;
            min-width: 180px;
        }
        .value {
            color: #6b7280;
            flex: 1;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
        }
        .damage-list {
            margin-top: 10px;
        }
        .damage-item {
            background: #fef3c7;
            padding: 10px;
            margin: 6px 0;
            border-radius: 6px;
            font-size: 13px;
            border-left: 3px solid #f59e0b;
        }
        .highlight {
            background: #dbeafe;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
        }
        @media print {
            body { margin: 0; padding: 20px; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
            .data-row { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">🚗 INFORME DE TASACIÓN DE VEHÍCULO</h1>
        <p class="subtitle">Portal de Tasaciones CVO - ${new Date().toLocaleDateString('es-ES')}</p>
        <p class="subtitle">Matrícula: <span class="highlight">${data.matricula || 'No especificada'}</span></p>
    </div>

    <div class="section">
        <h2 class="section-title">📋 DATOS BÁSICOS DEL VEHÍCULO</h2>
        <div class="data-row">
            <span class="label">Matrícula:</span>
            <span class="value">${data.matricula || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Kilómetros actuales:</span>
            <span class="value">${data.kmActuales ? data.kmActuales.toLocaleString() + ' km' : 'No especificados'}</span>
        </div>
        <div class="data-row">
            <span class="label">Procedencia:</span>
            <span class="value">${data.procedencia || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Fecha matriculación:</span>
            <span class="value">${data.fechaMatriculacion || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Fecha confirmada:</span>
            <span class="value">${data.fechaMatriculacionConfirmada ? '✅ Sí' : '❌ No'}</span>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">🏷️ MARCA, MODELO Y VERSIÓN</h2>
        <div class="data-row">
            <span class="label">Marca:</span>
            <span class="value">${data.marca || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Modelo:</span>
            <span class="value">${data.modelo || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Versión:</span>
            <span class="value">${data.version || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Tipo de combustible:</span>
            <span class="value">${data.combustible || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Transmisión:</span>
            <span class="value">${data.transmision || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Segunda llave:</span>
            <span class="value">${data.segundaLlave ? '✅ Sí' : '❌ No'}</span>
        </div>
        ${data.elementosDestacables ? `
        <div class="data-row">
            <span class="label">Elementos destacables:</span>
            <span class="value">${data.elementosDestacables}</span>
        </div>
        ` : ''}
    </div>

    ${data.danosExteriores && data.danosExteriores.length > 0 ? `
    <div class="section">
        <h2 class="section-title">🔧 DAÑOS EXTERIORES IDENTIFICADOS</h2>
        <div class="damage-list">
            ${data.danosExteriores.map((dano: any, index: number) => `
                <div class="damage-item">
                    <strong>${index + 1}. ${dano.vista}:</strong> ${dano.tipo} - ${dano.descripcion || 'Sin descripción adicional'}
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${data.estadoMotor ? `
    <div class="section">
        <h2 class="section-title">⚙️ ESTADO MECÁNICO</h2>
        <div class="data-row">
            <span class="label">Motor:</span>
            <span class="value">${data.estadoMotor}</span>
        </div>
        <div class="data-row">
            <span class="label">Dirección:</span>
            <span class="value">${data.estadoDireccion || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Sistema de frenos:</span>
            <span class="value">${data.estadoFrenos || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Caja de cambios:</span>
            <span class="value">${data.estadoCaja || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Transmisión:</span>
            <span class="value">${data.estadoTransmision || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Embrague:</span>
            <span class="value">${data.estadoEmbrague || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Estado general:</span>
            <span class="value">${data.estadoGeneral || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Daño estructural:</span>
            <span class="value">${data.danoEstructural ? '⚠️ Sí' : '✅ No'}</span>
        </div>
        ${data.danoEstructural && data.detallesDanoEstructural ? `
        <div class="data-row">
            <span class="label">Detalles del daño:</span>
            <span class="value">${data.detallesDanoEstructural}</span>
        </div>
        ` : ''}
        ${data.testigosEncendidos && data.testigosEncendidos.length > 0 ? `
        <div class="data-row">
            <span class="label">Testigos encendidos:</span>
            <span class="value">⚠️ ${data.testigosEncendidos.join(', ')}</span>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2 class="section-title">📄 DATOS ADICIONALES</h2>
        <div class="data-row">
            <span class="label">Origen del vehículo:</span>
            <span class="value">${data.origenVehiculo || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Documentos que acreditan KM:</span>
            <span class="value">${data.documentosKm || 'No especificados'}</span>
        </div>
        <div class="data-row">
            <span class="label">Comprado nuevo:</span>
            <span class="value">${data.comproNuevo ? '✅ Sí' : '❌ No'}</span>
        </div>
        <div class="data-row">
            <span class="label">Color:</span>
            <span class="value">${data.color || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Movilidad:</span>
            <span class="value">${data.movilidad || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Servicio público:</span>
            <span class="value">${data.servicioPublico || 'Ninguno'}</span>
        </div>
        <div class="data-row">
            <span class="label">Etiqueta ambiental:</span>
            <span class="value">${data.etiquetaMedioambiental || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">ITV en vigor:</span>
            <span class="value">${data.itvEnVigor ? '✅ Sí' : '❌ No'}</span>
        </div>
        ${data.proximaITV ? `
        <div class="data-row">
            <span class="label">Próxima ITV:</span>
            <span class="value">${data.proximaITV}</span>
        </div>
        ` : ''}
        ${data.observaciones ? `
        <div class="data-row">
            <span class="label">Observaciones:</span>
            <span class="value">${data.observaciones}</span>
        </div>
        ` : ''}
    </div>

    ${metadata ? `
    <div class="section">
        <h2 class="section-title">🔒 INFORMACIÓN DE VERIFICACIÓN</h2>
        ${metadata.timestamp ? `
        <div class="data-row">
            <span class="label">Fecha de envío:</span>
            <span class="value">${new Date(metadata.timestamp).toLocaleString('es-ES')}</span>
        </div>
        ` : ''}
        ${metadata.ip ? `
        <div class="data-row">
            <span class="label">Dirección IP:</span>
            <span class="value">${metadata.ip}</span>
        </div>
        ` : ''}
        ${metadata.geolocalizacion ? `
        <div class="data-row">
            <span class="label">Ubicación geográfica:</span>
            <span class="value">${metadata.geolocalizacion.latitude}°, ${metadata.geolocalizacion.longitude}°</span>
        </div>
        ` : ''}
        ${metadata.dispositivo ? `
        <div class="data-row">
            <span class="label">Plataforma:</span>
            <span class="value">${metadata.dispositivo.platform}</span>
        </div>
        <div class="data-row">
            <span class="label">Idioma del sistema:</span>
            <span class="value">${metadata.dispositivo.idioma}</span>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>📋 CERTIFICADO DE AUTENTICIDAD</strong></p>
        <p>Este documento ha sido generado automáticamente por el Portal de Tasaciones CVO</p>
        <p>Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
        <p>Los datos contenidos en este informe han sido proporcionados por el cliente y verificados mediante sistemas de geolocalización y metadatos de dispositivo.</p>
    </div>

    <script>
        // Auto-imprimir al cargar si se abre en una nueva ventana
        if (window.opener) {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>
  `
}




