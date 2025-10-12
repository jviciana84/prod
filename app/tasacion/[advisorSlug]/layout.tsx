import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portal Tasaciones',
  description: 'Sistema para tasación de vehículos',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'Portal Tasaciones',
    description: 'Sistema para tasación de vehículos',
    type: 'website',
    siteName: 'Portal Tasaciones',
    images: [
      {
        url: '/svg/tasaciones-icon.svg',
        width: 512,
        height: 512,
        alt: 'Portal Tasaciones',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal Tasaciones',
    description: 'Sistema para tasación de vehículos',
    images: ['/svg/tasaciones-icon.svg'],
  },
  icons: {
    icon: '/svg/tasaciones-icon.svg',
    apple: '/svg/tasaciones-icon.svg',
  },
}

export default function TasacionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

