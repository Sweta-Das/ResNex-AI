// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['image.pollinations.ai'],
  },
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
}

module.exports = nextConfig
