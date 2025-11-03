/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['*.supabase.co'],
  },
}

module.exports = nextConfig

