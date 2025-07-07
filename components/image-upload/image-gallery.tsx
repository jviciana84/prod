"use client"

import { useEffect, useState } from "react"
import { Trash2, Download, ExternalLink } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Image = {
  id: string
  url: string
  filename: string
  description: string | null
  created_at: string
}

export function ImageGallery() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("images").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error("Error fetching images:", error)
      toast({
        title: "Failed to load images",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Get the image URL first
      const image = images.find((img) => img.id === id)
      if (!image) return

      // Delete from Supabase
      const { error } = await supabase.from("images").delete().eq("id", id)

      if (error) throw error

      // Note: We can't delete from Vercel Blob here as it requires server-side code
      // In a real app, you'd create an API endpoint to handle Blob deletion

      // Update local state
      setImages(images.filter((img) => img.id !== id))
      toast({
        title: "Image deleted",
        description: "The image has been removed from the database",
      })
    } catch (error) {
      console.error("Error deleting image:", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/30">
        <p className="text-muted-foreground">No images uploaded yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-video relative group">
              <img
                src={image.url || "/placeholder.svg"}
                alt={image.description || image.filename}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30"
                  onClick={() => window.open(image.url, "_blank")}
                >
                  <ExternalLink size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30"
                  onClick={() => {
                    const a = document.createElement("a")
                    a.href = image.url
                    a.download = image.filename
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                  }}
                >
                  <Download size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 hover:text-red-500"
                  onClick={() => setDeleteId(image.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-sm font-medium truncate" title={image.description || ""}>
                {image.description || image.filename}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(image.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
