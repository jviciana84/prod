import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tasación de Vehículo | Portal de Tasaciones',
  description: 'Sistema de tasación detallada de vehículos',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function TasacionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

