/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [],
  // Configuración de webpack para pdfjs-dist
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Cliente: deshabilitar módulos de Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
      }
    }
    
    return config
  },
}

export default nextConfig
