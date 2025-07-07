"use client"

import type React from "react"

import { useState } from "react"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { uploadGuaranteeCosts } from "@/server-actions/incentivos-actions" // Nuevo server action

export function GuaranteeCostUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setUploadStatus("idle")
    } else {
      setFile(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Por favor, selecciona un archivo para subir.")
      return
    }

    setLoading(true)
    setUploadStatus("idle")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadGuaranteeCosts(formData)

      if (result.success) {
        toast.success(result.message)
        setUploadStatus("success")
        setFile(null) // Clear file input after successful upload
      } else {
        toast.error(result.message)
        setUploadStatus("error")
      }
    } catch (error) {
      console.error("Error uploading guarantee costs:", error)
      toast.error("Error al procesar el archivo. Inténtalo de nuevo.")
      setUploadStatus("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Carga Coste Garantías</DialogTitle>
        <DialogDescription>Sube un archivo CSV o Excel con las matrículas y sus costes de garantía.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="file" className="text-right">
            Archivo
          </Label>
          <Input id="file" type="file" className="col-span-3" onChange={handleFileChange} accept=".csv, .xlsx" />
        </div>
        {file && <p className="text-sm text-muted-foreground text-center">Archivo seleccionado: {file.name}</p>}
      </div>
      <DialogFooter>
        {uploadStatus === "success" && (
          <div className="flex items-center text-green-500 mr-2">
            <CheckCircle className="h-5 w-5 mr-1" />
            Carga exitosa
          </div>
        )}
        {uploadStatus === "error" && (
          <div className="flex items-center text-red-500 mr-2">
            <XCircle className="h-5 w-5 mr-1" />
            Error en la carga
          </div>
        )}
        <Button onClick={handleSubmit} disabled={loading || !file}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Subir archivo
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}
