import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Razack Packaging Centre',
    short_name: 'Razack Pkg',
    description: 'High-quality packaging materials for your business needs.',
    start_url: '/',
    display: 'standalone', // Standard app feel that keeps the system status bar and navigation gestures visible
    background_color: '#111827',
    theme_color: '#111827',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}