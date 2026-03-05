'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ConnectorProfile, EXPERTISE_OPTIONS, HELPS_WITH_OPTIONS } from '@/lib/types'

const PAGE_SIZE = 20

type Sort = 'newest' | 'alpha' | 'most_intros'
type ConnectorWithStats = ConnectorProfile & { total_requests?: number; accepted_requests?: number }

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
        active
          ? 'bg-emerald-500 text-black border-emerald-500'
          : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

export default function Connectors() {
  const [connectors, setConnectors] = useState<ConnectorWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isFounder, setIsFounder] = useState(false)
  const [expertiseFilters, setExpertiseFilters] = useState<Set<string>>(new Set())
  const [helpsFilters, setHelpsFilters] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<Sort>('newest')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: fp } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
        setIsFounder(!!fp)
      }

      const { data } = await supabase
        .from('connector_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      const cList = data ?? []

      // Batch-fetch request stats per connector
      if (cList.length > 0) {
        const usernames = cList.map((c: ConnectorProfile) => c.username)
        const { data: reqs } = await supabase
          .from('intro_requests')
          .select('connector_username, status')
          .in('connector_username', usernames)

        const statsMap: Record<string, { total: number; accepted: number }> = {}
        reqs?.forEach((r: { connector_username: string; status: string }) => {
          if (!statsMap[r.connector_username]) statsMap[r.connector_username] = { total: 0, accepted: 0 }
          statsMap[r.connector_username].total++
          if (r.status === 'accepted') statsMap[r.connector_username].accepted++
        })

        setConnectors(cList.map((c: ConnectorProfile) => ({
          ...c,
          total_requests: statsMap[c.username]?.total ?? 0,
          accepted_requests: statsMap[c.username]?.accepted ?? 0,
        })))
      } else {
        setConnectors([])
      }
      setLoading(false)
    }
    load()
  }, [])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [search, expertiseFilters, helpsFilters, sort])

  const toggleExpertise = (v: string) => setExpertiseFilters(prev => {
    const next = new Set(prev)
    next.has(v) ? next.delete(v) : next.add(v)
    return next
  })
  const toggleHelps = (v: string) => setHelpsFilters(prev => {
    const next = new Set(prev)
    next.has(v) ? next.delete(v) : next.add(v)
    return next
  })

  const filtered = useMemo(() => {
    let list = connectors.filter(c => {
      const expertise = c.expertise?.split(',').map(s => s.trim()) ?? []
      const helps = c.helps_with?.split(',').map(s => s.trim()) ?? []
      if (expertiseFilters.size > 0 && !Array.from(expertiseFilters).every(f => expertise.includes(f))) return false
      if (helpsFilters.size > 0 && !Array.from(helpsFilters).every(f => helps.includes(f))) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = `${c.name} ${c.bio} ${c.expertise} ${c.helps_with}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    switch (sort) {
      case 'alpha':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'most_intros':
        list = [...list].sort((a, b) => (b.accepted_requests ?? 0) - (a.accepted_requests ?? 0))
        break
      default:
        break // newest — already sorted by created_at desc from DB
    }
    return list
  }, [connectors, search, expertiseFilters, helpsFilters, sort])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const hasActiveFilters = expertiseFilters.size > 0 || helpsFilters.size > 0 || search

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-4">
            <Link href="/browse/founders" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Browse Founders</Link>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {connectors.length} connectors available
          </div>
          <h1 className="text-4xl font-bold mb-2">Browse Connectors</h1>
          <p className="text-gray-400">Find the right person to make your intro happen.</p>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, bio, or expertise…"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as Sort)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="newest" className="bg-zinc-900">Newest first</option>
            <option value="most_intros" className="bg-zinc-900">Most intros made</option>
            <option value="alpha" className="bg-zinc-900">A–Z</option>
          </select>
        </div>

        {/* Filter chips */}
        <div className="space-y-3 mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Expertise</p>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map(o => (
                <Chip key={o.value} label={o.label} active={expertiseFilters.has(o.value)} onClick={() => toggleExpertise(o.value)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Helps With</p>
            <div className="flex flex-wrap gap-2">
              {HELPS_WITH_OPTIONS.map(o => (
                <Chip key={o.value} label={o.label} active={helpsFilters.has(o.value)} onClick={() => toggleHelps(o.value)} />
              ))}
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={() => { setExpertiseFilters(new Set()); setHelpsFilters(new Set()); setSearch('') }}
              className="text-xs text-gray-400 hover:text-white transition-colors">
              Clear all filters ×
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-5">
          {loading ? 'Loading…' : `${filtered.length} connector${filtered.length !== 1 ? 's' : ''} found`}
          {hasActiveFilters && ' (filtered)'}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No connectors found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
            <button onClick={() => { setExpertiseFilters(new Set()); setHelpsFilters(new Set()); setSearch('') }}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Clear all filters →
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map(connector => {
                const expertiseTags = connector.expertise?.split(',').map(s => s.trim()).filter(Boolean) ?? []
                const helpsTags = connector.helps_with?.split(',').map(s => s.trim()).filter(Boolean) ?? []
                const helpsLabels = helpsTags.map(v => HELPS_WITH_OPTIONS.find(o => o.value === v)?.label ?? v)
                const acceptRate = (connector.total_requests ?? 0) > 0
                  ? Math.round(((connector.accepted_requests ?? 0) / connector.total_requests!) * 100)
                  : null

                return (
                  <div key={connector.id} className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                        {connector.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">{connector.name}</h3>
                        <p className="text-xs text-gray-500 font-mono truncate">warmchain.com/c/{connector.username}</p>
                        {acceptRate !== null && (
                          <p className="text-xs text-emerald-400 mt-0.5">{acceptRate}% acceptance · {connector.accepted_requests} intros made</p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">{connector.bio}</p>

                    {expertiseTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {expertiseTags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{tag}</span>
                        ))}
                      </div>
                    )}

                    {helpsLabels.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1.5">Helps with</p>
                        <div className="flex flex-wrap gap-1.5">
                          {helpsLabels.map(label => (
                            <span key={label} className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10">{label}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-4 flex gap-2">
                      <Link href={`/c/${connector.username}`}
                        className="flex-1 text-center py-2 text-sm border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-all">
                        View Profile
                      </Link>
                      {isFounder ? (
                        <Link href={`/c/${connector.username}?request=1`}
                          className="flex-1 text-center py-2 text-sm bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-all">
                          Request Intro
                        </Link>
                      ) : (
                        <Link href="/signup"
                          className="flex-1 text-center py-2 text-sm bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-all">
                          Sign up to request
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 text-sm border border-white/20 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  ← Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                      page === i ? 'bg-emerald-500 text-black' : 'border border-white/20 text-gray-400 hover:bg-white/5'
                    }`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                  className="px-4 py-2 text-sm border border-white/20 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
