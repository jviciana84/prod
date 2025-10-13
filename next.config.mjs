/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['pdf-parse'],
  // Configuración de webpack para pdf-parse (sin canvas)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
        'canvas': false, // Deshabilitar canvas completamente
      })
    }
    
    // Configuración para manejar dependencias nativas
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      canvas: false, // Forzar que canvas no se use
    }
    
    return config
  },
}

export default nextConfig
