import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Razack Packaging Centre',
    short_name: 'Razack Pkg',
    description: 'High-quality packaging materials for your business needs.',
    start_url: '/',
    display: 'standalone', // This hides the browser URL bar to make it feel like a real app
    background_color: '#ffffff',
    theme_color: '#111827', // Gray-900 to match your app's top navbar
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