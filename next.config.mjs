/** @type {import('next').NextConfig} */
import withPWAInit from 'next-pwa';

// Initialize the PWA plugin
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Images configuration
  images: {
    unoptimized: true,
  },
  // Adding experimental features to enhance Next.js 15 compatibility
  experimental: {
    // These settings help with improved build performance and compatibility
    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: [],
  },
  // Increase webpack memory limit to handle larger builds
  webpack: (config) => {
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
};

// Export the configuration with PWA support
export default withPWA(nextConfig);
