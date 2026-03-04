'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Profile, ConnectorProfile, IntroRequest, NEEDS_OPTIONS, HELPS_WITH_OPTIONS } from '@/lib/types'

// ─── Founder Dashboard ───────────────────────────────────────────────────────

function FounderDashboard({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [requests, setRequests] = useState<(IntroRequest & { connector_name?: string })[]>([])
  const [profileUrl, setProfileUrl] = useState('')

  useEffect(() => {
    setProfileUrl(`${window.location.origin}/${profile.username}`)
    const load = async () => {
      const supabase = createClient()
      const { data: reqs } = await supabase
        .from('intro_requests')
        .select('*')
        .eq('founder_username', profile.username)
        .order('created_at', { ascending: false })

      if (reqs && reqs.length > 0) {
        const usernames = reqs.map((r: IntroRequest) => r.connector_username)
        const { data: connectors } = await supabase
          .from('connector_profiles')
          .select('username, name')
          .in('username', usernames)

        const nameMap: Record<string, string> = {}
        connectors?.forEach((c: { username: string; name: string }) => { nameMap[c.username] = c.name })

        setRequests(reqs.map((r: IntroRequest) => ({ ...r, connector_name: nameMap[r.connector_username] })))
      } else {
        setRequests([])
      }
    }
    load()
  }, [profile.username])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const needsList = profile.needs?.split(',').filter(Boolean).map(v =>
    NEEDS_OPTIONS.find(o => o.value === v)?.label ?? v
  ) ?? []

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      declined: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return map[status] ?? map.pending
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-6">
            <Link href="/connectors" className="text-sm text-gray-400 hover:text-white transition-colors">Browse Connectors</Link>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">👔 Founder</span>
            <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-400 mb-10">Welcome back, {profile.company_name}.</p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] h-full">
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Your Profile</p>
              <h2 className="text-2xl font-bold mb-1">{profile.company_name}</h2>
              <p className="text-gray-400 text-sm mb-4">{profile.one_liner}</p>

              <div className="space-y-2 mb-5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Stage:</span>
                  <span className="text-white">{profile.stage}</span>
                </div>
                {profile.mrr && <div className="flex items-center gap-2"><span className="text-gray-500">MRR:</span><span className="text-emerald-400 font-medium">{profile.mrr}</span></div>}
                {profile.users_count && <div className="flex items-center gap-2"><span className="text-gray-500">Users:</span><span className="text-white">{profile.users_count}</span></div>}
                {profile.growth && <div className="flex items-center gap-2"><span className="text-gray-500">Growth:</span><span className="text-white">{profile.growth}</span></div>}
              </div>

              {needsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {needsList.map(n => (
                    <span key={n} className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{n}</span>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Link href={`/${profile.username}`}
                  className="block w-full py-2.5 bg-white text-black font-semibold rounded-xl text-center text-sm hover:bg-emerald-400 transition-all">
                  View Public Profile
                </Link>
                <button onClick={() => { navigator.clipboard.writeText(profileUrl); alert('Link copied!') }}
                  className="block w-full py-2.5 border border-white/20 text-white font-medium rounded-xl text-center text-sm hover:bg-white/5 transition-all">
                  Copy Profile Link
                </button>
                <Link href="/connectors"
                  className="block w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-xl text-center text-sm hover:bg-emerald-500/20 transition-all">
                  Browse Connectors →
                </Link>
              </div>
            </div>
          </div>

          {/* Intro requests */}
          <div className="lg:col-span-2">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Intro Requests</p>
                <span className="text-xs text-gray-500">{requests.length} total</span>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📬</div>
                  <p className="text-gray-400 mb-2">No requests sent yet</p>
                  <p className="text-sm text-gray-500 mb-5">Find connectors who can help and send your first request.</p>
                  <Link href="/connectors" className="inline-block px-5 py-2.5 bg-emerald-500 text-black font-bold rounded-xl text-sm hover:bg-emerald-400 transition-all">
                    Browse Connectors
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{req.connector_name ?? req.connector_username}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${statusBadge(req.status)}`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{req.message}</p>
                        </div>
                        <Link href={`/connector/${req.connector_username}`}
                          className="text-xs text-gray-500 hover:text-emerald-400 transition-colors flex-shrink-0">
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Connector Dashboard ──────────────────────────────────────────────────────

function ConnectorDashboard({ profile }: { profile: ConnectorProfile }) {
  const router = useRouter()
  const [requests, setRequests] = useState<(IntroRequest & { founder_company?: string; founder_one_liner?: string; founder_stage?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: reqs } = await supabase
        .from('intro_requests')
        .select('*')
        .eq('connector_username', profile.username)
        .order('created_at', { ascending: false })

      if (reqs && reqs.length > 0) {
        const usernames = reqs.map((r: IntroRequest) => r.founder_username)
        const { data: founders } = await supabase
          .from('profiles')
          .select('username, company_name, one_liner, stage')
          .in('username', usernames)

        const founderMap: Record<string, { company_name: string; one_liner: string; stage: string }> = {}
        founders?.forEach((f: { username: string; company_name: string; one_liner: string; stage: string }) => {
          founderMap[f.username] = f
        })

        setRequests(reqs.map((r: IntroRequest) => ({
          ...r,
          founder_company: founderMap[r.founder_username]?.company_name,
          founder_one_liner: founderMap[r.founder_username]?.one_liner,
          founder_stage: founderMap[r.founder_username]?.stage,
        })))
      } else {
        setRequests([])
      }
      setLoading(false)
    }
    load()
  }, [profile.username])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const updateStatus = async (id: string, status: 'accepted' | 'declined') => {
    setUpdating(id)
    try {
      const supabase = createClient()
      await supabase.from('intro_requests').update({ status }).eq('id', id)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } finally {
      setUpdating(null)
    }
  }

  const pending = requests.filter(r => r.status === 'pending')
  const handled = requests.filter(r => r.status !== 'pending')

  const helpsTags = profile.helps_with?.split(',').filter(Boolean).map(v =>
    HELPS_WITH_OPTIONS.find(o => o.value === v)?.label ?? v
  ) ?? []

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">🤝 Connector</span>
            <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white transition-colors">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-1">Inbox</h1>
        <p className="text-gray-400 mb-10">Welcome back, {profile.name}.</p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Your Profile</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xl font-bold text-black">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.expertise?.split(',').slice(0,2).join(', ')}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4 line-clamp-3">{profile.bio}</p>
              {helpsTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {helpsTags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10">{t}</span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{requests.length}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{requests.filter(r => r.status === 'accepted').length}</div>
                  <div className="text-xs text-gray-500">Accepted</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{pending.length}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
              <Link href={`/connector/${profile.username}`}
                className="block w-full mt-4 py-2.5 border border-white/20 text-white font-medium rounded-xl text-center text-sm hover:bg-white/5 transition-all">
                View Public Profile
              </Link>
            </div>
          </div>

          {/* Inbox */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Pending Requests</p>
                {pending.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    {pending.length} new
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pending.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-400 text-sm">No pending requests</p>
                  <p className="text-xs text-gray-500 mt-1">Founders will send structured intro requests here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.map(req => (
                    <div key={req.id} className="p-5 rounded-xl border border-yellow-500/10 bg-yellow-500/5 hover:border-yellow-500/20 transition-all">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold flex-shrink-0">
                          {(req.founder_company ?? req.founder_username).charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{req.founder_company ?? req.founder_username}</span>
                            {req.founder_stage && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10">{req.founder_stage}</span>
                            )}
                          </div>
                          {req.founder_one_liner && (
                            <p className="text-sm text-gray-400 mt-0.5">{req.founder_one_liner}</p>
                          )}
                        </div>
                        <Link href={`/${req.founder_username}`} target="_blank"
                          className="text-xs text-gray-500 hover:text-emerald-400 transition-colors flex-shrink-0">
                          View profile →
                        </Link>
                      </div>

                      <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-300 leading-relaxed">"{req.message}"</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(req.id, 'accepted')}
                          disabled={updating === req.id}
                          className="flex-1 py-2.5 bg-emerald-500 text-black font-bold rounded-lg text-sm hover:bg-emerald-400 transition-all disabled:opacity-50"
                        >
                          {updating === req.id ? '…' : '✓ Accept'}
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'declined')}
                          disabled={updating === req.id}
                          className="flex-1 py-2.5 border border-white/20 text-gray-300 rounded-lg text-sm hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                          {updating === req.id ? '…' : '✕ Decline'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Handled */}
            {handled.length > 0 && (
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">History</p>
                <div className="space-y-3">
                  {handled.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10">
                      <div>
                        <span className="font-medium text-sm">{req.founder_company ?? req.founder_username}</span>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.message}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs border ml-3 flex-shrink-0 ${req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [founderProfile, setFounderProfile] = useState<Profile | null>(null)
  const [connectorProfile, setConnectorProfile] = useState<ConnectorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { router.push('/login'); return }

      const [{ data: founder }, { data: connector }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('connector_profiles').select('*').eq('user_id', user.id).single(),
      ])

      if (founder) setFounderProfile(founder)
      else if (connector) setConnectorProfile(connector)
      else router.push('/builder')

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (founderProfile) return <FounderDashboard profile={founderProfile} />
  if (connectorProfile) return <ConnectorDashboard profile={connectorProfile} />
  return null
}
