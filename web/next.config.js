const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fully client-side app (backend is a separate WebSocket server), so we ship
  // a static export — the simplest, most reliable thing to host on Netlify.
  output: 'export',
  images: { unoptimized: true },
  transpilePackages: ['@rps/shared'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
    };
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    return config;
  },
};

module.exports = nextConfig;
