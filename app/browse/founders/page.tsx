'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Profile, STAGES, NEEDS_OPTIONS } from '@/lib/types'

const PAGE_SIZE = 20

export default function BrowseFounders() {
  const [founders, setFounders] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnector, setIsConnector] = useState(false)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [needsFilter, setNeedsFilter] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: cp } = await supabase.from('connector_profiles').select('id').eq('user_id', user.id).single()
        setIsConnector(!!cp)
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setFounders(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => { setPage(0) }, [search, stageFilter, needsFilter])

  const filtered = useMemo(() => founders.filter(f => {
    if (stageFilter && f.stage !== stageFilter) return false
    if (needsFilter && !f.needs?.split(',').includes(needsFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = `${f.company_name} ${f.one_liner} ${f.traction} ${f.needs}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  }), [founders, search, stageFilter, needsFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const hasFilters = search || stageFilter || needsFilter

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-4">
            <Link href="/connectors" className="text-sm text-gray-400 hover:text-white transition-colors">Browse Connectors</Link>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {founders.length} startup profiles
          </div>
          <h1 className="text-4xl font-bold mb-2">Browse Founders</h1>
          <p className="text-gray-400">Discover founders looking for intros. Filter by stage and what they need.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company, one-liner…"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
            <option value="" className="bg-zinc-900">All stages</option>
            {STAGES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
          </select>
          <select value={needsFilter} onChange={e => setNeedsFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
            <option value="" className="bg-zinc-900">All needs</option>
            {NEEDS_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setStageFilter(''); setNeedsFilter('') }}
              className="px-3 py-2.5 text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap">
              Clear ×
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-5">
          {loading ? 'Loading…' : `${filtered.length} founder${filtered.length !== 1 ? 's' : ''} found`}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No founders found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters</p>
            <button onClick={() => { setSearch(''); setStageFilter(''); setNeedsFilter('') }}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">Clear filters →</button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map(founder => {
                const needsTags = founder.needs?.split(',').filter(Boolean).map(v => NEEDS_OPTIONS.find(o => o.value === v)?.label ?? v) ?? []
                return (
                  <div key={founder.id} className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                        {founder.company_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">{founder.company_name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/10">{founder.stage}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">{founder.one_liner}</p>

                    {(founder.mrr || founder.users_count || founder.growth) && (
                      <div className="flex gap-2 flex-wrap mb-4">
                        {founder.mrr && <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{founder.mrr} MRR</span>}
                        {founder.users_count && <span className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10">{founder.users_count} users</span>}
                        {founder.growth && <span className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-gray-400 border border-white/10">{founder.growth}</span>}
                      </div>
                    )}

                    {needsTags.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1.5">Looking for</p>
                        <div className="flex flex-wrap gap-1.5">
                          {needsTags.map(t => (
                            <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <Link href={`/f/${founder.username}`}
                        className="block w-full text-center py-2 text-sm bg-white text-black font-semibold rounded-lg hover:bg-emerald-400 transition-all">
                        View Profile →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 text-sm border border-white/20 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 transition-all">← Prev</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === i ? 'bg-emerald-500 text-black' : 'border border-white/20 text-gray-400 hover:bg-white/5'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                  className="px-4 py-2 text-sm border border-white/20 text-gray-300 rounded-xl hover:bg-white/5 disabled:opacity-40 transition-all">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
