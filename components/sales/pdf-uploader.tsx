"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Upload, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export function PdfUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError(null)

    if (!selectedFile) {
      return
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Por favor, selecciona un archivo PDF")
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Por favor, selecciona un archivo PDF")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al procesar el PDF")
      }

      const data = await response.json()

      if (data.success) {
        setSuccess("PDF procesado correctamente. Redirigiendo...")
        setTimeout(() => {
          router.push("/dashboard/ventas")
        }, 2000)
      } else {
        throw new Error(data.error || "Error al procesar el PDF")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el PDF")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pdf-file">Selecciona un archivo PDF</Label>
        <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} disabled={isUploading} />
      </div>

      {file && (
        <Card className="bg-muted/50">
          <CardContent className="flex items-center gap-2 p-4">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground ml-auto">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-500" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!file || isUploading} className="flex items-center gap-2">
          {isUploading ? (
            <>Procesando...</>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Subir y Procesar PDF</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
