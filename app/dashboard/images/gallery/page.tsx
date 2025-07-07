import { ImageGallery } from "@/components/image-upload/image-gallery"
import { createServerClient } from "@/lib/supabase/server"

export default async function GalleryPage() {
  const supabase = createServerClient()

  // Check if the images table exists
  const { data: tableExists } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_name", "images")
    .eq("table_schema", "public")
    .single()

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Image Gallery</h1>
        <p className="text-muted-foreground">View and manage your uploaded images</p>
      </div>

      {!tableExists ? (
        <div className="p-4 border rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <h3 className="font-semibold mb-2">Setup Required</h3>
          <p>
            The images table doesn't exist in your Supabase database. Please visit the upload page first to set up the
            required database structure.
          </p>
        </div>
      ) : (
        <ImageGallery />
      )}
    </div>
  )
}
