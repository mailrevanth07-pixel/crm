/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://crm-19gz.onrender.com',
  },
  // Disable experimental features that might cause issues
  experimental: {
    esmExternals: false,
  },
  // Add public runtime config for better environment variable handling
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://crm-19gz.onrender.com',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://crm-19gz.onrender.com',
  },
}

module.exports = nextConfig
