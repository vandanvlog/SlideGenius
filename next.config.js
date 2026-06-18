/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist, pptxgenjs and mammoth ship their own bundles and shouldn't be
  // re-bundled by Next's server compiler — that breaks their internal requires.
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist', 'pptxgenjs', 'mammoth'],
  },
  webpack: (config) => {
    // pdfjs-dist optionally pulls in `canvas` (native) which we don't need for
    // text extraction. Alias it to false so the build doesn't try to resolve it.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
