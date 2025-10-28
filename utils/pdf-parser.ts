// @ts-ignore
import PDFParser from 'pdf2json';
import { formatTextWithSpaces } from './format-text';

export interface ParsedPDFData {
  vin: string;
  marca: string;
  modelo: string;
  version: string;
  color: string;
  tapiceria: string;
  equipacion: string[];
}

export async function parseBMWMiniPDF(pdfBuffer: Buffer): Promise<ParsedPDFData> {
  try {
    // Use pdf2json which is more compatible with Node.js
    const pdfParser = new PDFParser();
    
    const fullText = await new Promise<string>((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error(errData.parserError));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Extract text from all pages
          let text = '';
          if (pdfData.Pages) {
            pdfData.Pages.forEach((page: any) => {
              if (page.Texts) {
                page.Texts.forEach((textItem: any) => {
                  if (textItem.R) {
                    textItem.R.forEach((r: any) => {
                      if (r.T) {
                        text += decodeURIComponent(r.T) + ' ';
                      }
                    });
                  }
                });
              }
            });
          }
          resolve(text);
        } catch (error) {
          reject(error);
        }
      });
      
      pdfParser.parseBuffer(pdfBuffer);
    });
    
    // Limpiar el texto: pdf2json extrae con espacios entre CADA carácter
    // "U s u a r i o" -> "Usuario"
    // Eliminar TODOS los espacios ya que el PDF tiene espacios incorrectos
    const cleanText = fullText.replace(/\s/g, '');
    
    console.log('📝 Texto limpio (primeros 500 chars):', cleanText.substring(0, 500));
    
    // Parse data
    const parsed: ParsedPDFData = {
      vin: '',
      marca: 'MINI',
      modelo: '',
      version: '',
      color: '',
      tapiceria: '',
      equipacion: []
    };
    
    // Extract VIN - buscar el corto de 7 caracteres (2W98621)
    const vinMatch = cleanText.match(/Vin-7[\/]*PrefijodelVIN:([A-Z0-9]{7})/i);
    if (vinMatch) {
      parsed.vin = vinMatch[1];
    } else {
      // Try full VIN as fallback (17 characters)
      const fullVinMatch = cleanText.match(/WMW[A-Z0-9]{14}/);
      if (fullVinMatch) {
        parsed.vin = fullVinMatch[0];
      }
    }
    
    // Extract Description (modelo) - sin espacios
    const descripcionMatch = cleanText.match(/Descripción:([^M]+?)Multiple/i);
    if (descripcionMatch) {
      let desc = descripcionMatch[1];
      // Agregar espacios antes de mayúsculas y números
      desc = desc
        .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/([0-9])([A-Z])/g, '$1 $2')
        .trim();
      parsed.modelo = desc;
      parsed.marca = 'MINI';
      parsed.version = desc;
    }
    
    // Extract Color - patrón: Color:C6AM-NanuqWhite
    const colorMatch = cleanText.match(/Color:[A-Z0-9]+[A-Z]?-([A-Za-z]+)(?=Tapicería)/i);
    if (colorMatch) {
      const color = colorMatch[1];
      // Agregar espacios antes de mayúsculas
      parsed.color = color.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
    
    // Extract Tapiceria - patrón: Tapicería:TCB2-Combinación...Vehiculo
    const tapiceriaMatch = cleanText.match(/Tapicería:[A-Z0-9]+-(.+?)Vehiculo/i);
    if (tapiceriaMatch) {
      let tap = tapiceriaMatch[1];
      // Agregar espacios y limpiar
      tap = tap
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-záéíóú])([A-ZÁÉÍÓÚ])/g, '$1 $2')
        .replace(/([a-z])([A-ZÁÉÍÓÚ])/g, '$1 $2')
        .replace(/!/g, '')
        .trim();
      parsed.tapiceria = tap;
    }
    
    // Extract Equipacion - buscar códigos de 4 caracteres seguidos de descripción
    // Patrón: 01CBACEA/CO2Umfang01DFNorma...
    const equipoSection = cleanText.match(/Equipoopcionalsolicitado(.+?)Equipoopcionaldeserie/i);
    if (equipoSection) {
      const equipoText = equipoSection[1];
      
      // Buscar todos los códigos de 4 dígitos/letras
      const matches = equipoText.matchAll(/([0-9A-Z]{4})([^0-9]{2,}?)(?=[0-9A-Z]{4}|$)/g);
      
      for (const match of matches) {
        const descripcion = formatTextWithSpaces(match[2]);
        
        if (descripcion && descripcion.length > 5 && descripcion.length < 100) {
          parsed.equipacion.push(descripcion);
        }
      }
    }
    
    // Also extract "Equipo opcional de serie"
    const equipoSerieSection = cleanText.match(/Equipoopcionaldeserie(.+?)Warranty/i);
    if (equipoSerieSection) {
      const equipoSerieText = equipoSerieSection[1];
      const matches = equipoSerieText.matchAll(/([0-9A-Z]{4})([^0-9]{2,}?)(?=[0-9A-Z]{4}|$)/g);
      
      for (const match of matches) {
        const descripcion = formatTextWithSpaces(match[2]);
        
        if (descripcion && descripcion.length > 5 && descripcion.length < 100 && !parsed.equipacion.includes(descripcion)) {
          parsed.equipacion.push(descripcion);
        }
      }
    }
    
    return parsed;
    
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Error al parsear PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

