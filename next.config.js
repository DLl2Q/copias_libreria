/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/copias_libreria',
  images: {
    unoptimized: true,
  },
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig