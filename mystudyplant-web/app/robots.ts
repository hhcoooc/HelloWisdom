import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/register', '/profile', '/publish', '/notifications'],
    },
    // TODO: 上线后替换为实际域名
    sitemap: 'http://localhost:3000/sitemap.xml',
  }
}