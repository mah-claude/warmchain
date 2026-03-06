import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://warmchain.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: founders }, { data: connectors }] = await Promise.all([
    supabase.from('profiles').select('username, created_at').order('created_at', { ascending: false }),
    supabase.from('connector_profiles').select('username, created_at').order('created_at', { ascending: false }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/connectors`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/browse/founders`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const founderRoutes: MetadataRoute.Sitemap = (founders ?? []).map(f => ({
    url: `${BASE}/f/${f.username}`,
    lastModified: new Date(f.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const connectorRoutes: MetadataRoute.Sitemap = (connectors ?? []).map(c => ({
    url: `${BASE}/c/${c.username}`,
    lastModified: new Date(c.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...founderRoutes, ...connectorRoutes]
}
