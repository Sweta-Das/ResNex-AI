/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // This tells Next.js to ignore the "canvas" error
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;