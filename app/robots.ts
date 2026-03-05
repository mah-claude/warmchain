import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/f/', '/c/', '/connectors', '/browse/', '/about', '/faq'],
        disallow: ['/dashboard', '/builder', '/connector-builder', '/admin/', '/api/'],
      },
    ],
    sitemap: 'https://warmchain.com/sitemap.xml',
  }
}
