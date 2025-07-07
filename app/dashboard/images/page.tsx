import { ImageUploader } from "@/components/image-upload/image-uploader"
import { createServerClient } from "@/lib/supabase/server"

export default async function ImagesPage() {
  const supabase = createServerClient()

  // Check if the images table exists, if not we'll show a setup message
  const { data: tableExists } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_name", "images")
    .eq("table_schema", "public")
    .single()

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Image Management</h1>
        <p className="text-muted-foreground">Upload and manage images using Vercel Blob and Supabase</p>
      </div>

      {!tableExists ? (
        <div className="p-4 border rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <h3 className="font-semibold mb-2">Setup Required</h3>
          <p className="mb-4">The images table doesn't exist in your Supabase database. You need to create it first.</p>
          <pre className="p-3 bg-black/10 dark:bg-white/10 rounded-md overflow-x-auto text-sm">
            {`CREATE TABLE public.images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  description TEXT,
  size INTEGER,
  content_type TEXT,
  user_id UUID REFERENCES auth.users(id)
);

-- Set up RLS policies
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all images
CREATE POLICY "Users can view all images" 
  ON public.images FOR SELECT 
  USING (true);

-- Allow users to insert their own images
CREATE POLICY "Users can insert their own images" 
  ON public.images FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own images
CREATE POLICY "Users can update their own images" 
  ON public.images FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images" 
  ON public.images FOR DELETE 
  USING (auth.uid() = user_id);`}
          </pre>
        </div>
      ) : (
        <ImageUploader />
      )}
    </div>
  )
}
