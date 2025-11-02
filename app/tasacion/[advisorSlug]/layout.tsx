import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import TasacionClientWrapper from "./components/tasacion-client-wrapper"

interface TasacionLayoutProps {
  children: React.ReactNode
  params: Promise<{
    advisorSlug: string
  }>
}

export async function generateMetadata({ params }: TasacionLayoutProps): Promise<Metadata> {
  const { advisorSlug } = await params
  
  try {
    const supabase = await createServerClient(await cookies())
    
    // Obtener información del asesor desde el slug
    const { data: advisorLink } = await supabase
      .from("advisor_tasacion_links")
      .select("advisor_name")
      .eq("slug", advisorSlug)
      .single()

    const advisorName = advisorLink?.advisor_name || "CVO"
    
    return {
      title: `Tasación de Vehículo - QUADIS Munich - ${advisorName}`,
      description: `Complete la tasación de su vehículo con ${advisorName}. Formulario fácil y rápido.`,
      openGraph: {
        title: `Tasación de Vehículo - QUADIS Munich - ${advisorName}`,
        description: `Complete la tasación de su vehículo con ${advisorName}. Formulario fácil y rápido.`,
        type: 'website',
        locale: 'es_ES',
        siteName: 'QUADIS Munich',
        images: [
          {
            url: 'https://controlvo.ovh/svg/logo_tasaciones.png',
            width: 800,
            height: 600,
            alt: 'QUADIS Munich Logo',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Tasación de Vehículo - QUADIS Munich - ${advisorName}`,
        description: `Complete la tasación de su vehículo con ${advisorName}. Formulario fácil y rápido.`,
        images: ['https://controlvo.ovh/svg/logo_tasaciones.png'],
      },
    }
  } catch (error) {
    // Si hay error, usar metadatos genéricos
    return {
      title: 'Tasación de Vehículo - QUADIS Munich',
      description: 'Formulario de tasación de vehículo. Complete la información de su vehículo de forma rápida y sencilla.',
      openGraph: {
        title: 'Tasación de Vehículo - QUADIS Munich',
        description: 'Complete la tasación de su vehículo. Formulario fácil y rápido.',
        type: 'website',
        locale: 'es_ES',
        siteName: 'QUADIS Munich',
        images: [
          {
            url: 'https://controlvo.ovh/svg/logo_tasaciones.png',
            width: 800,
            height: 600,
            alt: 'QUADIS Munich Logo',
          },
        ],
      },
    }
  }
}

export default async function TasacionLayout({ children }: TasacionLayoutProps) {
  return (
    <TasacionClientWrapper>
      {children}
    </TasacionClientWrapper>
  )
}
