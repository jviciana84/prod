"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Save, Info, Clipboard } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface ProcessedRecord {
  matricula: string
  primaTotal: number
  found: boolean
  isValidUpdate: boolean
  isPending: boolean
  isManufacturerWarranty: boolean
}

interface ExcelWarrantyUploaderProps {
  onUploadComplete: () => void
}

export function ExcelWarrantyUploader({ onUploadComplete }: ExcelWarrantyUploaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<ProcessedRecord[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showPasteDialog, setShowPasteDialog] = useState(false)
  const [pastedData, setPastedData] = useState("")
  const [excelData, setExcelData] = useState<any[][]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [pendingWarranties, setPendingWarranties] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchPendingWarranties = async () => {
      try {
        const response = await fetch("/api/incentivos/pending-warranties")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setPendingWarranties(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching pending warranties:", error)
        setPendingWarranties([])
      }
    }

    fetchPendingWarranties()
  }, [])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Por favor, selecciona un archivo Excel válido (.xlsx o .xls)")
      return
    }

    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][]

      setExcelData(jsonData)
      
      // Usar índices por defecto pero con validación
      const startRow = 2
      const matriculaCol = 21
      const primaCol = 20

      // Validar que las columnas existen
      if (jsonData.length === 0) {
        throw new Error("El archivo Excel está vacío")
      }

      const maxCol = Math.max(...jsonData.map(row => row.length))
      if (matriculaCol >= maxCol || primaCol >= maxCol) {
        throw new Error(`El archivo Excel no tiene suficientes columnas. Se esperaban al menos ${Math.max(matriculaCol, primaCol) + 1} columnas, pero solo tiene ${maxCol}`)
      }

      processExcelData(jsonData, startRow, matriculaCol, primaCol)
    } catch (error) {
      console.error("❌ Error procesando Excel:", error)
      toast.error("Error al procesar el archivo Excel: " + (error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePasteData = () => {
    if (!pastedData.trim()) {
      toast.error("Por favor, pega algunos datos primero")
      return
    }

    try {
      const lines = pastedData.trim().split("\n")
      const processedLines = lines.map((line) => line.split("\t"))
      setExcelData(processedLines)
      processExcelData(processedLines, 0, 1, 0)
      setShowPasteDialog(false)
      setPastedData("")
    } catch (error) {
      console.error("❌ Error procesando datos pegados:", error)
      toast.error("Error al procesar los datos pegados")
    }
  }

  const processExcelData = (data: any[][], startRow: number, matriculaCol: number, primaCol: number) => {
    try {
      const processed: ProcessedRecord[] = []

      for (let i = startRow; i < data.length; i++) {
        const row = data[i]
        if (!row || row.length === 0) continue

        const matriculaRaw = row[matriculaCol]
        const primaRaw = row[primaCol]

        const matricula = matriculaRaw?.toString().trim()
        const primaValue = primaRaw?.toString().replace(",", ".") || "0"
        const primaTotal = Number.parseFloat(primaValue)

        if (matricula && matricula !== "" && !isNaN(primaTotal) && primaTotal >= 0) {
          // Asegurar que pendingWarranties sea un array
          const warrantiesArray = Array.isArray(pendingWarranties) ? pendingWarranties : []
          const currentIncentive = warrantiesArray.find(
            (inc: any) => inc.matricula?.toLowerCase() === matricula.toLowerCase(),
          )

          const isManufacturerWarranty = currentIncentive?.garantia === 0
          const isValidUpdate = primaTotal > 0

          const record = {
            matricula,
            primaTotal,
            found: !!currentIncentive,
            isValidUpdate,
            isPending: !!currentIncentive,
            isManufacturerWarranty,
          }

          processed.push(record)
        }
      }

      // Añadir las matrículas pendientes que no se encontraron en el Excel
      const warrantiesArray = Array.isArray(pendingWarranties) ? pendingWarranties : []
      const foundInExcel = processed.map((p) => p.matricula.toLowerCase())
      const missingInExcel = warrantiesArray.filter((w) => !foundInExcel.includes(w.matricula?.toLowerCase()))

      for (const missing of missingInExcel) {
        processed.push({
          matricula: missing.matricula,
          primaTotal: 0,
          found: true,
          isValidUpdate: false,
          isPending: true,
          isManufacturerWarranty: missing.garantia === 0,
        })
      }

      setProcessedData(processed)
      setShowResults(true)
      toast.success(`Procesados ${processed.length} registros`)
    } catch (error) {
      console.error("❌ Error procesando datos:", error)
      toast.error("Error al procesar los datos: " + (error as Error).message)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const validRecords = processedData.filter(
        (record) => record.found && record.isValidUpdate && record.primaTotal > 0,
      )

      if (validRecords.length === 0) {
        toast.error("No hay registros válidos para guardar")
        return
      }

      console.log(`🔄 Guardando ${validRecords.length} registros...`)

      // Crear un timeout de 15 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: La operación tardó demasiado")), 15000)
      })

      const savePromise = fetch("/api/incentivos/update-warranties-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates: validRecords.map((record) => ({
            matricula: record.matricula,
            garantia: record.primaTotal,
          })),
        }),
      })

      const response = await Promise.race([savePromise, timeoutPromise]) as Response
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}: ${response.statusText}`)
      }

      if (result.success) {
        toast.success(`✅ Actualizadas ${result.updated} garantías correctamente`)
        setShowResults(false)
        setProcessedData([])
        setExcelData([])
        onUploadComplete()
      } else {
        throw new Error(result.error || "Error al procesar la respuesta del servidor")
      }
    } catch (error) {
      console.error("❌ Error guardando datos:", error)
      toast.error(`Error al guardar los datos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseModal = () => {
    setShowResults(false)
    setProcessedData([])
    setExcelData([])
  }

  const handleDirectUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const validRecords = processedData.filter((r) => r.found && r.isValidUpdate && r.primaTotal > 0)
  const manufacturerWarrantyRecords = processedData.filter((r) => r.found && r.isManufacturerWarranty)
  const missingInExcelRecords = processedData.filter((r) => r.found && !r.isValidUpdate && !r.isManufacturerWarranty)

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleDirectUpload} disabled={isProcessing}>
          <FileSpreadsheet className="h-4 w-4" />
          {isProcessing ? "Procesando..." : "Cargar Excel"}
        </Button>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPasteDialog(true)}>
          <Clipboard className="h-4 w-4" />
          Pegar Datos
        </Button>
      </div>

      {/* Modal para pegar datos */}
      <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clipboard className="h-5 w-5" />
              Pegar Datos de Excel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Instrucciones:</strong>
                <br />
                1. En Excel, selecciona las columnas de matrícula y prima
                <br />
                2. Copia los datos (Ctrl+C)
                <br />
                3. Pega aquí abajo (Ctrl+V)
                <br />
                4. Primera columna: matrícula, segunda: prima
              </p>
            </div>

            <Textarea
              placeholder="Pega aquí los datos copiados de Excel...&#10;Ejemplo:&#10;1234ABC	150.50&#10;5678DEF	200.75"
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />

            {pastedData && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Vista previa:</p>
                <div className="text-xs font-mono bg-background rounded border p-2 max-h-32 overflow-y-auto">
                  {pastedData
                    .split("\n")
                    .slice(0, 5)
                    .map((line, i) => {
                      const parts = line.split("\t")
                      return (
                        <div key={i} className="flex gap-4">
                          <span className="text-muted-foreground w-8">{i + 1}:</span>
                          <span className="text-blue-600">{parts[0] || "-"}</span>
                          <span className="text-green-600">{parts[1] || "-"}</span>
                        </div>
                      )
                    })}
                  {pastedData.split("\n").length > 5 && (
                    <div className="text-muted-foreground">... y {pastedData.split("\n").length - 5} líneas más</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePasteData} disabled={!pastedData.trim()}>
              Procesar Datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de resultados */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Resultados de Carga Masiva de Garantías
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-800">Se Actualizarán</div>
                    <div className="text-2xl font-bold text-green-600">{validRecords.length}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-800">Garantía Fabricante</div>
                    <div className="text-2xl font-bold text-blue-600">{manufacturerWarrantyRecords.length}</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-800">Faltantes en Excel</div>
                    <div className="text-2xl font-bold text-red-600">{missingInExcelRecords.length}</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-semibold text-yellow-800">Total Pendientes</div>
                    <div className="text-2xl font-bold text-yellow-600">{pendingWarranties.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de resultados */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Prima Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedData.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {!record.found ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            No encontrado
                          </Badge>
                        ) : record.isManufacturerWarranty ? (
                          <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 border-blue-200">
                            <Info className="h-3 w-3" />
                            Garantía Fabricante
                          </Badge>
                        ) : record.isValidUpdate ? (
                          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3" />
                            Se Actualizará
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Faltante en Excel
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{record.matricula}</TableCell>
                      <TableCell>{record.primaTotal > 0 ? `${record.primaTotal.toFixed(2)} €` : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Info técnica */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-mono text-xs">
                Datos procesados: {excelData.length} filas. Registros válidos: {validRecords.length}
              </p>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseModal}
              >
                Cerrar
              </Button>
              <Button onClick={handleSave} disabled={validRecords.length === 0 || isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar {validRecords.length} registros
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
