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
  serverExternalPackages: ['pdf-parse', 'canvas'],
  // Configuración de webpack para pdf-parse y canvas
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'canvas': 'commonjs canvas',
        'pdf-parse': 'commonjs pdf-parse'
      })
      
      // Asegurar alias correctos para canvas
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': 'canvas',
      }
    }
    
    // Configuración para manejar dependencias nativas
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    }
    
    return config
  },
}

export default nextConfig
