import { type NextRequest, NextResponse } from "next/server"
import { put as vercelBlobPut, del as vercelBlobDel } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server" // Using server client for API routes

export async function POST(req: NextRequest) {
  const authToken = req.headers.get("Authorization")?.split("Bearer ")[1]
  if (!process.env.EMAIL_PROCESSOR_SECRET || authToken !== process.env.EMAIL_PROCESSOR_SECRET) {
    console.warn("Unauthorized attempt to access email-processor API")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const payload = await req.json()
    const {
      emailSubject,
      emailSender,
      emailDate,
      pdfFilename,
      pdfContentBase64,
      extractedText,
      // extractedFields // Uncomment if you send structured data
    } = payload

    if (!pdfFilename || !pdfContentBase64) {
      return NextResponse.json({ error: "Missing PDF filename or content" }, { status: 400 })
    }

    const supabase = createClient()

    // 1. Upload PDF to Vercel Blob
    const pdfBuffer = Buffer.from(pdfContentBase64, "base64")
    // Sanitize filename and make it unique
    const safeFilename = pdfFilename.replace(/[^a-zA-Z0-9._-]/g, "_")
    const blobPath = `email_attachments/${Date.now()}_${safeFilename}`

    let pdfBlobUrl = ""
    try {
      console.log(`Uploading ${blobPath} to Vercel Blob...`)
      const blob = await vercelBlobPut(blobPath, pdfBuffer, {
        access: "public",
        contentType: "application/pdf",
        // Add cache control if PDFs are immutable once uploaded
        // cacheControlMaxAge: 31536000, // 1 year
      })
      pdfBlobUrl = blob.url
      console.log(`PDF uploaded to Vercel Blob: ${pdfBlobUrl}`)
    } catch (blobError: any) {
      console.error("Error uploading PDF to Vercel Blob:", blobError)
      return NextResponse.json(
        { error: "Failed to upload PDF to blob storage", details: blobError.message },
        { status: 500 },
      )
    }

    // 2. Save metadata to Supabase
    // Ensure your 'pdf_extracted_data' table has these columns or adapt as needed.
    // Common columns: raw_text (TEXT), pdf_blob_url (TEXT), original_filename (TEXT),
    // extracted_at (TIMESTAMPTZ), source (TEXT), email_subject (TEXT), email_sender (TEXT), email_received_at (TIMESTAMPTZ)
    // Plus any specific fields you extract like 'vehicle_license_plate', 'order_number', etc.

    const insertData: any = {
      raw_text: extractedText,
      pdf_blob_url: pdfBlobUrl,
      original_filename: pdfFilename,
      extracted_at: new Date().toISOString(),
      source: "email_processor_v2", // Use a versioned source
      email_subject: emailSubject,
      email_sender: emailSender,
      email_received_at: emailDate ? new Date(emailDate).toISOString() : null,
      // ...extractedFields, // Spread your structured fields here if you send them
    }

    // Example: if you have a column for license plate
    // if (extractedFields?.licensePlate) {
    //   insertData.vehicle_license_plate = extractedFields.licensePlate;
    // }

    console.log("Inserting data into Supabase table pdf_extracted_data...")
    const { data: dbResult, error: dbError } = await supabase
      .from("pdf_extracted_data")
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error("Supabase error inserting into pdf_extracted_data:", dbError)
      // Rollback: Delete the uploaded PDF from blob storage if DB insert fails
      try {
        await vercelBlobDel(pdfBlobUrl)
        console.log(`Rolled back blob upload: ${pdfBlobUrl}`)
      } catch (delError) {
        console.error(`Failed to rollback blob upload for ${pdfBlobUrl}:`, delError)
      }
      return NextResponse.json(
        { error: "Failed to save PDF extraction data to database", details: dbError.message },
        { status: 500 },
      )
    }

    console.log("Successfully processed and stored email PDF data. DB ID:", dbResult.id)
    return NextResponse.json(
      { success: true, message: "Email data processed and PDF stored.", data: dbResult },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Internal server error in email-processor API:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
