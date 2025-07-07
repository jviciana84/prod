"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Check } from "lucide-react"
import { put } from "@vercel/blob"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function ImageUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadedUrl(null) // Reset previous upload
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      // 1. Upload to Vercel Blob
      const newFilename = `${Date.now()}-${file.name}`
      const result = await put(newFilename, file, {
        access: "public",
      })

      // 2. Store metadata in Supabase
      const { data, error } = await supabase
        .from("images")
        .insert([
          {
            url: result.url,
            filename: file.name,
            description: description,
            size: file.size,
            content_type: file.type,
          },
        ])
        .select()

      if (error) throw error

      setUploadedUrl(result.url)
      toast({
        title: "Upload successful",
        description: "Your image has been uploaded and saved",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload Image</CardTitle>
        <CardDescription>Upload an image to Vercel Blob and save metadata to Supabase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">Select Image</Label>
          <Input id="file" type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Enter image description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />
        </div>

        {uploadedUrl && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <Check size={16} />
              <span className="text-sm font-medium">Upload successful</span>
            </div>
            <div className="relative aspect-video rounded-md overflow-hidden border">
              <img
                src={uploadedUrl || "/placeholder.svg"}
                alt={description || "Uploaded image"}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
          {uploading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Uploading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload size={16} />
              Upload Image
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
