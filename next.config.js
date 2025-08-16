/** @type {import('next').NextConfig} */
const nextConfig = {
  // Headers para permitir cámara y geolocalización
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
