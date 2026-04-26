import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KakeSo（カケソ）',
    short_name: 'KakeSo',
    description: 'チャットで記録、SNSで節約モチベUP！Z世代の家計簿アプリ',
    start_url: '/chat',
    display: 'standalone',
    background_color: '#f2f4f2',
    theme_color: '#059669',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
