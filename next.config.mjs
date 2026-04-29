/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // PDF render: ne bundle-aj playwright-core/sparticuz binarjev v function output,
  // sicer Vercel ne najde Chromium executable-a in nft jih ne tracea pravilno.
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
}

export default nextConfig
