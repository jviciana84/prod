import { del } from "@vercel/blob"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { id, url } = await request.json()

    if (!id || !url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Delete from Supabase
    const supabase = createServerClient()
    const { error: supabaseError } = await supabase.from("images").delete().eq("id", id)

    if (supabaseError) {
      return NextResponse.json({ error: `Supabase error: ${supabaseError.message}` }, { status: 500 })
    }

    // 2. Delete from Vercel Blob
    // Extract the pathname from the URL
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Delete the blob using the pathname
    await del(pathname)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
