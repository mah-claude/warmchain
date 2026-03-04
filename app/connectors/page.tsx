'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ConnectorProfile, EXPERTISE_OPTIONS, HELPS_WITH_OPTIONS } from '@/lib/types'

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      {label}
    </span>
  )
}

export default function Connectors() {
  const [connectors, setConnectors] = useState<ConnectorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isFounder, setIsFounder] = useState(false)
  const [expertiseFilter, setExpertiseFilter] = useState('')
  const [helpsFilter, setHelpsFilter] = useState('')
  const router = useRouter()

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

      setConnectors(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = connectors.filter(c => {
    const expertise = c.expertise?.split(',').map(s => s.trim()) ?? []
    const helps = c.helps_with?.split(',').map(s => s.trim()) ?? []
    if (expertiseFilter && !expertise.includes(expertiseFilter)) return false
    if (helpsFilter && !helps.includes(helpsFilter)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {connectors.length} connectors available
          </div>
          <h1 className="text-4xl font-bold mb-2">Browse Connectors</h1>
          <p className="text-gray-400 text-lg">Find the right person to make your intro happen.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-medium">Expertise:</span>
            <select
              value={expertiseFilter}
              onChange={e => setExpertiseFilter(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="" className="bg-zinc-900">All</option>
              {EXPERTISE_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-medium">Helps with:</span>
            <select
              value={helpsFilter}
              onChange={e => setHelpsFilter(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="" className="bg-zinc-900">All</option>
              {HELPS_WITH_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
            </select>
          </div>
          {(expertiseFilter || helpsFilter) && (
            <button onClick={() => { setExpertiseFilter(''); setHelpsFilter('') }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              Clear filters ×
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No connectors found</h3>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(connector => {
              const expertiseTags = connector.expertise?.split(',').map(s => s.trim()).filter(Boolean) ?? []
              const helpsTags = connector.helps_with?.split(',').map(s => s.trim()).filter(Boolean) ?? []
              const helpsLabels = helpsTags.map(v =>
                HELPS_WITH_OPTIONS.find(o => o.value === v)?.label ?? v
              )

              return (
                <div key={connector.id} className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 flex flex-col">
                  {/* Avatar + name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                      {connector.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{connector.name}</h3>
                      <p className="text-sm text-gray-500">warmchain.com/c/{connector.username}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">{connector.bio}</p>

                  {/* Expertise tags */}
                  {expertiseTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {expertiseTags.map(tag => <Tag key={tag} label={tag} />)}
                    </div>
                  )}

                  {/* Helps with */}
                  {helpsLabels.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1.5">Helps with</p>
                      <div className="flex flex-wrap gap-1.5">
                        {helpsLabels.map(label => (
                          <span key={label} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                            {label}
                          </span>
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
        )}
      </div>
    </div>
  )
}
