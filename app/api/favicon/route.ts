import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Path to the static favicon
    const publicPath = path.join(process.cwd(), "public")
    const faviconPath = path.join(publicPath, "favicon.ico")

    // Check if favicon exists
    if (!fs.existsSync(faviconPath)) {
      return new NextResponse("Favicon not found", { status: 404 })
    }

    // Read the favicon from the file
    const faviconBuffer = fs.readFileSync(faviconPath)

    // Return the image as response
    return new NextResponse(faviconBuffer, {
      headers: {
        "Content-Type": "image/x-icon",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error serving favicon:", error)
    return new NextResponse("Error serving favicon", { status: 500 })
  }
}
