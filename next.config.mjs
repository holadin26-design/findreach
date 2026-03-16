/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configured to fix workspace root issues
  experimental: {
    // This helps in some cases with OOM during build/dev
    workerThreads: false,
  },
};

export default nextConfig;
