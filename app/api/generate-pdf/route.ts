import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { data, metadata } = await request.json()
    
    // Crear un PDF simple usando HTML y CSS
    const htmlContent = generateHTMLContent(data, metadata)
    
    // Para una implementación más robusta, podrías usar:
    // - Puppeteer
    // - jsPDF
    // - PDFKit
    // - Una API externa como HTML/CSS to PDF
    
    // Por ahora, devolvemos el HTML para que el cliente lo convierta
    return NextResponse.json({
      success: true,
      html: htmlContent,
      filename: `tasacion_${data.matricula || 'vehiculo'}_${Date.now()}.html`
    })
    
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json({
      success: false,
      message: 'Error al generar el PDF',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

function generateHTMLContent(data: any, metadata?: any): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Tasación</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            background: white;
            color: #333;
            line-height: 1.6;
        }
        .header {
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #6d28d9;
            margin: 0;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 25px;
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
            margin-bottom: 8px;
            padding: 5px 0;
        }
        .label {
            font-weight: bold;
            color: #374151;
            width: 150px;
            min-width: 150px;
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
        }
        .damage-list {
            margin-top: 10px;
        }
        .damage-item {
            background: #f3f4f6;
            padding: 8px;
            margin: 4px 0;
            border-radius: 4px;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; padding: 20px; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">INFORME DE TASACIÓN DE VEHÍCULO</h1>
        <p class="subtitle">Portal de Tasaciones - ${new Date().toLocaleDateString('es-ES')}</p>
    </div>

    <div class="section">
        <h2 class="section-title">DATOS BÁSICOS DEL VEHÍCULO</h2>
        <div class="data-row">
            <span class="label">Matrícula:</span>
            <span class="value">${data.matricula || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Kilómetros:</span>
            <span class="value">${data.kmActuales ? data.kmActuales.toLocaleString() : 'No especificados'}</span>
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
            <span class="value">${data.fechaMatriculacionConfirmada ? 'Sí' : 'No'}</span>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">MARCA, MODELO Y VERSIÓN</h2>
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
            <span class="label">Combustible:</span>
            <span class="value">${data.combustible || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Transmisión:</span>
            <span class="value">${data.transmision || 'No especificada'}</span>
        </div>
        <div class="data-row">
            <span class="label">Segunda llave:</span>
            <span class="value">${data.segundaLlave ? 'Sí' : 'No'}</span>
        </div>
        <div class="data-row">
            <span class="label">Elementos destacables:</span>
            <span class="value">${data.elementosDestacables || 'Ninguno'}</span>
        </div>
    </div>

    ${data.danosExteriores && data.danosExteriores.length > 0 ? `
    <div class="section">
        <h2 class="section-title">DAÑOS EXTERIORES</h2>
        <div class="damage-list">
            ${data.danosExteriores.map((dano: any) => `
                <div class="damage-item">
                    <strong>${dano.vista}:</strong> ${dano.tipo} - ${dano.descripcion || 'Sin descripción'}
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${data.estadoMotor ? `
    <div class="section">
        <h2 class="section-title">ESTADO MECÁNICO</h2>
        <div class="data-row">
            <span class="label">Motor:</span>
            <span class="value">${data.estadoMotor}</span>
        </div>
        <div class="data-row">
            <span class="label">Dirección:</span>
            <span class="value">${data.estadoDireccion || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Frenos:</span>
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
            <span class="value">${data.danoEstructural ? 'Sí' : 'No'}</span>
        </div>
        ${data.danoEstructural ? `
        <div class="data-row">
            <span class="label">Detalles daño:</span>
            <span class="value">${data.detallesDanoEstructural || 'Sin detalles'}</span>
        </div>
        ` : ''}
        ${data.testigosEncendidos && data.testigosEncendidos.length > 0 ? `
        <div class="data-row">
            <span class="label">Testigos encendidos:</span>
            <span class="value">${data.testigosEncendidos.join(', ')}</span>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2 class="section-title">DATOS ADICIONALES</h2>
        <div class="data-row">
            <span class="label">Origen:</span>
            <span class="value">${data.origenVehiculo || 'No especificado'}</span>
        </div>
        <div class="data-row">
            <span class="label">Documentos KM:</span>
            <span class="value">${data.documentosKm || 'No especificados'}</span>
        </div>
        <div class="data-row">
            <span class="label">Comprado nuevo:</span>
            <span class="value">${data.comproNuevo ? 'Sí' : 'No'}</span>
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
            <span class="value">${data.itvEnVigor ? 'Sí' : 'No'}</span>
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
        <h2 class="section-title">INFORMACIÓN DE VERIFICACIÓN</h2>
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
            <span class="label">Ubicación:</span>
            <span class="value">${metadata.geolocalizacion.latitude}, ${metadata.geolocalizacion.longitude}</span>
        </div>
        ` : ''}
        ${metadata.dispositivo ? `
        <div class="data-row">
            <span class="label">Dispositivo:</span>
            <span class="value">${metadata.dispositivo.platform}</span>
        </div>
        <div class="data-row">
            <span class="label">Idioma:</span>
            <span class="value">${metadata.dispositivo.idioma}</span>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="footer">
        <p>Este documento ha sido generado automáticamente por el Portal de Tasaciones</p>
        <p>Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
    </div>
</body>
</html>
  `
}


