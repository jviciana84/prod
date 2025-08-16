/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Configuración para desarrollo HTTPS
  devIndicators: {
    buildActivity: false,
  },
  // Headers para permitir cámara
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
