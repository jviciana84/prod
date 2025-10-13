// Polyfill para DOMMatrix en Node.js (requerido por canvas/pdf-parse)
if (typeof DOMMatrix === 'undefined') {
  // Implementación mínima de DOMMatrix compatible con canvas
  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(init?: string | number[]) {
      // Constructor básico sin procesamiento
    }

    translate(tx: number, ty: number, tz?: number) { return this; }
    scale(scaleX: number, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number) { return this; }
    rotate(rotX: number, rotY?: number, rotZ?: number) { return this; }
    rotateAxisAngle(x: number, y: number, z: number, angle: number) { return this; }
    skewX(sx: number) { return this; }
    skewY(sy: number) { return this; }
    multiply(other: any) { return this; }
    flipX() { return this; }
    flipY() { return this; }
    inverse() { return this; }
    transformPoint(point: any) { return point; }
    toFloat32Array() { return new Float32Array(16); }
    toFloat64Array() { return new Float64Array(16); }
    toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
  }

  class DOMPointPolyfill {
    x = 0; y = 0; z = 0; w = 1;
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x; this.y = y; this.z = z; this.w = w;
    }
  }

  (global as any).DOMMatrix = DOMMatrixPolyfill;
  (global as any).DOMPoint = DOMPointPolyfill;
}

export async function extractTextFromPDF(pdfBuffer: Buffer) {
  try {
    console.log("Iniciando extracción de texto del PDF...")
    console.log("Tamaño del buffer:", pdfBuffer.length)

    // Importar pdf-parse dinámicamente solo en runtime
    const pdfParse = (await import("pdf-parse")).default

    console.log("pdf-parse importado correctamente")

    // Configuración específica para evitar problemas con archivos de prueba
    const data = await pdfParse(pdfBuffer, {
      max: 0,
      version: "v1.10.100",
    })

    console.log("Texto extraído directamente del PDF:", data.text.substring(0, 200) + "...")

    if (data.text && data.text.trim().length > 0) {
      console.log("Extracción exitosa con pdf-parse")
      return {
        text: data.text,
        method: "direct",
        pages: data.numpages,
        info: data.info,
      }
    }

    console.error("No se extrajo texto del PDF")
    return null
  } catch (error) {
    console.error("Error extrayendo texto directamente del PDF:", error)
    return null
  }
}
