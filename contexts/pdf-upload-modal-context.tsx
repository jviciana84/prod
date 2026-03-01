"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import PdfUploadModal from "@/components/sales/pdf-upload-modal"

interface PdfUploadModalContextType {
  openModal: () => void
}

const PdfUploadModalContext = createContext<PdfUploadModalContextType | undefined>(undefined)

export function PdfUploadModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)

  return (
    <PdfUploadModalContext.Provider value={{ openModal }}>
      {children}
      <PdfUploadModal isOpen={isOpen} onClose={onClose} />
    </PdfUploadModalContext.Provider>
  )
}

export function usePdfUploadModal() {
  const context = useContext(PdfUploadModalContext)
  if (context === undefined) {
    throw new Error("usePdfUploadModal must be used within a PdfUploadModalProvider")
  }
  return context
}
