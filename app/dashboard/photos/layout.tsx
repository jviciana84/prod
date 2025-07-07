import type React from "react"
import type { Metadata } from "next"
import PhotosTabs from "@/components/photos/photos-tabs"

export const metadata: Metadata = {
  title: "Fotografías",
  description: "Gestión de fotografías de vehículos",
}

export default function PhotosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PhotosTabs />
      <main className="flex-1">{children}</main>
    </div>
  )
}
