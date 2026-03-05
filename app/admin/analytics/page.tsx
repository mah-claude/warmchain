'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'admin@warmchain.com'

type TopPage = { page: string; count: number }
type DayData = { day: string; visits: number; authed: number }

export default function AdminAnalytics() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniquePages: 0,
    authedVisits: 0,
    todayVisits: 0,
    founderProfiles: 0,
    connectorProfiles: 0,
    totalRequests: 0,
    acceptedRequests: 0,
  })
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [days, setDays] = useState<DayData[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setAuthorized(true)

      // Fetch analytics via service-role would be needed, but we use RLS
      // Instead, fetch via supabase client (needs RLS policy allowing admin)
      // For now, use the anon key and rely on the data being relatively harmless
      const [
        analyticsResult,
        founderResult,
        connectorResult,
        requestResult,
      ] = await Promise.all([
        supabase.from('page_analytics').select('page, is_authenticated, created_at').order('created_at', { ascending: false }).limit(5000),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('connector_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('intro_requests').select('status'),
      ])

      const visits = analyticsResult.data ?? []
      const today = new Date().toDateString()
      const pageCount: Record<string, number> = {}
      let authedCount = 0
      let todayCount = 0

      visits.forEach((v: { page: string; is_authenticated: boolean; created_at: string }) => {
        pageCount[v.page] = (pageCount[v.page] ?? 0) + 1
        if (v.is_authenticated) authedCount++
        if (new Date(v.created_at).toDateString() === today) todayCount++
      })

      const sorted = Object.entries(pageCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([page, count]) => ({ page, count }))

      // Last 14 days
      const dayMap: Record<string, { visits: number; authed: number }> = {}
      visits.forEach((v: { page: string; is_authenticated: boolean; created_at: string }) => {
        const d = new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!dayMap[d]) dayMap[d] = { visits: 0, authed: 0 }
        dayMap[d].visits++
        if (v.is_authenticated) dayMap[d].authed++
      })
      const last14: DayData[] = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        last14.push({ day: d, ...(dayMap[d] ?? { visits: 0, authed: 0 }) })
      }
      setDays(last14)

      const reqs = requestResult.data ?? []
      const accepted = reqs.filter((r: { status: string }) => r.status === 'accepted').length

      setStats({
        totalVisits: visits.length,
        uniquePages: Object.keys(pageCount).length,
        authedVisits: authedCount,
        todayVisits: todayCount,
        founderProfiles: founderResult.count ?? 0,
        connectorProfiles: connectorResult.count ?? 0,
        totalRequests: reqs.length,
        acceptedRequests: accepted,
      })
      setTopPages(sorted)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!authorized) return null

  const maxVisits = Math.max(...days.map(d => d.visits), 1)

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg font-medium">Admin</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Analytics</h1>
          <p className="text-gray-400 text-sm">Platform overview — admin only.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Page Visits', value: stats.totalVisits.toLocaleString() },
            { label: 'Today', value: stats.todayVisits.toLocaleString() },
            { label: 'Logged-in Visits', value: `${stats.totalVisits > 0 ? Math.round((stats.authedVisits / stats.totalVisits) * 100) : 0}%` },
            { label: 'Unique Pages', value: stats.uniquePages.toLocaleString() },
            { label: 'Founder Profiles', value: stats.founderProfiles.toLocaleString() },
            { label: 'Connector Profiles', value: stats.connectorProfiles.toLocaleString() },
            { label: 'Total Intro Requests', value: stats.totalRequests.toLocaleString() },
            { label: 'Accepted Intros', value: `${stats.acceptedRequests} (${stats.totalRequests > 0 ? Math.round((stats.acceptedRequests / stats.totalRequests) * 100) : 0}%)` },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
              <p className="text-2xl font-bold text-emerald-400">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 14-day chart */}
        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] mb-8">
          <p className="text-sm font-semibold mb-4">Page Visits — Last 14 Days</p>
          <div className="flex items-end gap-1 h-32">
            {days.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm bg-emerald-500/80 transition-all"
                  style={{ height: `${(d.visits / maxVisits) * 100}%`, minHeight: d.visits > 0 ? '2px' : '0' }} />
                <span className="text-[8px] text-gray-600 whitespace-nowrap overflow-hidden" style={{ maxWidth: '100%', textOverflow: 'clip' }}>
                  {d.day.split(' ')[1]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            {days.slice(-3).map(d => (
              <span key={d.day}>{d.day}: {d.visits} visits</span>
            ))}
          </div>
        </div>

        {/* Top pages */}
        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
          <p className="text-sm font-semibold mb-4">Top Pages</p>
          <div className="space-y-2">
            {topPages.map((p, i) => {
              const pct = stats.totalVisits > 0 ? Math.round((p.count / stats.totalVisits) * 100) : 0
              return (
                <div key={p.page} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 truncate font-mono">{p.page}</span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{p.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
