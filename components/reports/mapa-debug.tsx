"use client"
import { useState, useEffect } from "react"
import { pathsProvincias } from "./mapa-final-data"

interface ProvinceMapping {
  [key: number]: string
}

export function MapaDebug() {
  const [selectedPath, setSelectedPath] = useState<number | null>(null)
  const [provinceName, setProvinceName] = useState("")
  const [mappings, setMappings] = useState<ProvinceMapping>({})
  const [savedMappings, setSavedMappings] = useState<string>("")

  // Cargar mapeos guardados
  useEffect(() => {
    const saved = localStorage.getItem('provinceMappings')
    if (saved) {
      setMappings(JSON.parse(saved))
    }
  }, [])

  const handlePathClick = (pathId: number) => {
    setSelectedPath(pathId)
    // Si ya tenemos un mapeo para este path, mostrarlo
    if (mappings[pathId]) {
      setProvinceName(mappings[pathId])
    } else {
      setProvinceName("")
    }
  }

  const saveMapping = () => {
    if (selectedPath !== null && provinceName.trim()) {
      const newMappings = { ...mappings, [selectedPath]: provinceName.trim() }
      setMappings(newMappings)
      localStorage.setItem('provinceMappings', JSON.stringify(newMappings))
      
      // Generar código TypeScript
      const mappingCode = `export const preciseProvinceMapping = ${JSON.stringify(newMappings, null, 2)};\n\nconst inverseMapping = {};\nObject.entries(preciseProvinceMapping).forEach(([id, provincia]) => {\n  inverseMapping[provincia] = parseInt(id);\n});\n\nexport const inverseProvinceMapping = inverseMapping;`
      setSavedMappings(mappingCode)
      
      alert(`Guardado: Path ${selectedPath} = ${provinceName}`)
    }
  }

  const clearMappings = () => {
    setMappings({})
    setSavedMappings("")
    localStorage.removeItem('provinceMappings')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(savedMappings)
    alert('Código copiado al portapapeles')
  }

         return (
     <div className="h-full flex flex-col">
       <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">Modo Debug - Identificar Provincias</h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Haz clic en cada provincia del mapa y escribe su nombre para crear el mapeo correcto.
        </p>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <strong>Path seleccionado:</strong> {selectedPath !== null ? selectedPath : 'Ninguno'}
        </div>
                   <input
             type="text"
             placeholder="Nombre de la provincia"
             value={provinceName}
             onChange={(e) => setProvinceName(e.target.value)}
             className="px-3 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
           />
         <button
           onClick={saveMapping}
           className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
         >
           Guardar Mapeo
         </button>
         <button
           onClick={clearMappings}
           className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
         >
           Limpiar Todo
         </button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
         <div className="relative">
           <svg
             width="100%"
             height="100%"
             viewBox="0 0 800 507"
             className="w-full h-full border border-gray-200 rounded-lg bg-white"
             preserveAspectRatio="xMidYMid meet"
           >
            <g id="spain-provinces">
              {pathsProvincias.map((path, index) => (
                <path
                  key={index}
                  d={path.d}
                  fill={selectedPath === path.id ? "#ff6b6b" : mappings[path.id] ? "#90EE90" : "#e5e7eb"}
                  stroke={selectedPath === path.id ? "#ff0000" : mappings[path.id] ? "#008000" : "#9ca3af"}
                  strokeWidth={selectedPath === path.id ? "2" : "0.5"}
                  className="cursor-pointer hover:fill-blue-200 transition-colors"
                  onClick={() => handlePathClick(path.id)}
                />
              ))}
            </g>
          </svg>

          {selectedPath !== null && (
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Path ID: {selectedPath}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Haz clic en otro path para seleccionarlo</p>
            </div>
          )}
        </div>

                 <div className="space-y-4 flex flex-col h-full">
           <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex-1 min-h-0">
             <h4 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Mapeos Guardados ({Object.keys(mappings).length}/50):</h4>
             <div className="h-full overflow-y-auto">
               {Object.entries(mappings).map(([id, name]) => (
                 <div key={id} className="text-sm py-1 text-gray-900 dark:text-gray-100">
                   <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 rounded text-gray-900 dark:text-gray-100">{id}</span> → {name}
                 </div>
               ))}
             </div>
           </div>

           {savedMappings && (
             <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
               <h4 className="font-bold mb-2 text-green-800 dark:text-green-200">Código TypeScript Generado:</h4>
               <button
                 onClick={copyToClipboard}
                 className="mb-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
               >
                 Copiar Código
               </button>
               <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600 overflow-x-auto text-gray-900 dark:text-gray-100 max-h-40 overflow-y-auto">
                 {savedMappings}
               </pre>
             </div>
           )}
         </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Instrucciones:</h4>
        <ol className="text-sm space-y-1 text-gray-900 dark:text-gray-100">
          <li>1. Haz clic en una provincia del mapa (se resaltará en rojo)</li>
          <li>2. Escribe el nombre exacto de la provincia en el campo de texto</li>
          <li>3. Haz clic en "Guardar Mapeo"</li>
          <li>4. Las provincias mapeadas se mostrarán en verde</li>
          <li>5. Cuando termines, copia el código TypeScript generado</li>
        </ol>
      </div>
    </div>
  )
}
