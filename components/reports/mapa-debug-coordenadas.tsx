"use client"
import { useState, useEffect } from "react"

interface CoordenadaDebug {
  nombre: string
  x: number
  y: number
  pathIndex: number
}

export function MapaDebugCoordenadas() {
  const [coordenadas, setCoordenadas] = useState<CoordenadaDebug[]>([])

  useEffect(() => {
    // Simular el cálculo de coordenadas como en el script
    const calcularCentroPath = (d: string, index: number) => {
      const comandos = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) || [];
      let xCoords: number[] = [];
      let yCoords: number[] = [];
      let currentX = 0;
      let currentY = 0;
      
      comandos.forEach(comando => {
        const tipo = comando[0];
        const valores = comando.slice(1).trim().split(/[\s,]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
        
        if (tipo === 'M') {
          if (valores.length >= 2) {
            currentX = valores[0];
            currentY = valores[1];
            xCoords.push(currentX);
            yCoords.push(currentY);
          }
        } else if (tipo === 'L') {
          for (let i = 0; i < valores.length; i += 2) {
            if (valores[i] !== undefined && valores[i + 1] !== undefined) {
              currentX = valores[i];
              currentY = valores[i + 1];
              xCoords.push(currentX);
              yCoords.push(currentY);
            }
          }
        } else if (tipo === 'l') {
          for (let i = 0; i < valores.length; i += 2) {
            if (valores[i] !== undefined && valores[i + 1] !== undefined) {
              currentX += valores[i];
              currentY += valores[i + 1];
              xCoords.push(currentX);
              yCoords.push(currentY);
            }
          }
        } else if (tipo === 'H') {
          valores.forEach(x => {
            if (x !== undefined) {
              currentX = x;
              xCoords.push(currentX);
              yCoords.push(currentY);
            }
          });
        } else if (tipo === 'h') {
          valores.forEach(x => {
            if (x !== undefined) {
              currentX += x;
              xCoords.push(currentX);
              yCoords.push(currentY);
            }
          });
        } else if (tipo === 'V') {
          valores.forEach(y => {
            if (y !== undefined) {
              currentY = y;
              xCoords.push(currentX);
              yCoords.push(currentY);
            }
          });
        } else if (tipo === 'v') {
          valores.forEach(y => {
            if (y !== undefined) {
              currentY += y;
              xCoords.push(currentX);
              yCoords.push(currentY);
            }
          });
        }
      });
      
      if (xCoords.length === 0 || yCoords.length === 0) {
        return { x: 400, y: 287 };
      }
      
      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);
      
      const centroX = (minX + maxX) / 2;
      const centroY = (minY + maxY) / 2;
      
      return { x: centroX, y: centroY };
    };

    // Cargar el SVG y calcular coordenadas
    fetch('/dashboard/images/spain-provinces (1).svg')
      .then(response => response.text())
      .then(svgContent => {
        const pathMatches = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
        if (pathMatches) {
          const coordenadasCalculadas: CoordenadaDebug[] = [];
          
          pathMatches.forEach((pathElement, index) => {
            const dMatch = pathElement.match(/d="([^"]*)"/);
            if (dMatch) {
              const centro = calcularCentroPath(dMatch[1], index);
              coordenadasCalculadas.push({
                nombre: `Provincia_${index}`,
                x: centro.x,
                y: centro.y,
                pathIndex: index
              });
            }
          });
          
          setCoordenadas(coordenadasCalculadas);
        }
      })
      .catch(error => {
        console.error('Error cargando SVG:', error);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Debug: Coordenadas Calculadas
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando las coordenadas calculadas para cada provincia
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coordenadas.map((coord, index) => (
            <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded">
              <div className="font-semibold text-sm">{coord.nombre}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                X: {coord.x.toFixed(2)}, Y: {coord.y.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Path #{coord.pathIndex}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Resumen de Coordenadas
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Total de provincias: {coordenadas.length}</p>
          <p>Rango X: {coordenadas.length > 0 ? `${Math.min(...coordenadas.map(c => c.x)).toFixed(2)} - ${Math.max(...coordenadas.map(c => c.x)).toFixed(2)}` : 'N/A'}</p>
          <p>Rango Y: {coordenadas.length > 0 ? `${Math.min(...coordenadas.map(c => c.y)).toFixed(2)} - ${Math.max(...coordenadas.map(c => c.y)).toFixed(2)}` : 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}

