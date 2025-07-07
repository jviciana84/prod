import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { del } from "@vercel/blob"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const extornoId = searchParams.get("extorno_id")

    if (!extornoId) {
      return NextResponse.json({ success: false, error: "Extorno ID is required" }, { status: 400 })
    }

    // Fetch the extorno to get document URLs for deletion from Blob storage
    const { data: extorno, error: fetchError } = await supabase
      .from("extornos")
      .select("documentos_adjuntos, documentos_tramitacion")
      .eq("id", extornoId)
      .single()

    if (fetchError || !extorno) {
      console.warn(
        `Test extorno ${extornoId} not found or error fetching: ${fetchError?.message || "Not found"}. Proceeding with DB deletion.`,
      )
    } else {
      // Collect all document URLs
      const allDocuments = [...(extorno.documentos_adjuntos || []), ...(extorno.documentos_tramitacion || [])]
      const blobUrlsToDelete = allDocuments.map((doc) => doc.url)

      // Delete files from Vercel Blob storage
      if (blobUrlsToDelete.length > 0) {
        console.log(`Attempting to delete ${blobUrlsToDelete.length} blobs for test extorno ${extornoId}`)
        try {
          // The `del` function can take an array of URLs
          await del(blobUrlsToDelete)
          console.log(`Successfully deleted blobs for test extorno ${extornoId}`)
        } catch (blobDeleteError: any) {
          console.error(`Error deleting blobs for test extorno ${extornoId}: ${blobDeleteError.message}`)
          // Continue with DB deletion even if blob deletion fails
        }
      }
    }

    // Delete the extorno record from the database
    const { error: deleteError } = await supabase
      .from("extornos")
      .delete()
      .eq("id", extornoId)
      .eq("created_by", user.id) // Ensure only the creator can delete test records
      .eq("is_test", true) // Ensure only test records are deleted

    if (deleteError) {
      console.error("Error deleting test extorno from DB:", deleteError)
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Test extorno cleaned up successfully" })
  } catch (error: any) {
    console.error("Critical error in cleanup-test-extorno:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
