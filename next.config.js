/** @type {import('next').NextConfig} */
const nextConfig = {
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
