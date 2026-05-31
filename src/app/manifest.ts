// src/app/manifest.ts
import type { MetadataRoute } from 'next'

// 🚀 IMPORTANT: Change this number EVERY TIME you update the logo
// Start with 1, then 2, 3, 4... each time you replace icon files
const VERSION = 1  // <-- Increment this when you change logo

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Razack Packaging Centre',
    short_name: 'Razack Pkg',
    description: 'High-quality packaging materials for your business needs.',
    start_url: `/`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: `/icon-192x192.png?v=${VERSION}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-192x192.png?v=${VERSION}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: `/icon-512x512.png?v=${VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-512x512.png?v=${VERSION}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}