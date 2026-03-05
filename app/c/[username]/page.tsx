'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ConnectorProfile, EXPERTISE_OPTIONS, HELPS_WITH_OPTIONS } from '@/lib/types'

function Tag({ label, variant = 'default' }: { label: string; variant?: 'default' | 'green' }) {
  return variant === 'green'
    ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{label}</span>
    : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10">{label}</span>
}

export default function ConnectorPublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [profile, setProfile] = useState<ConnectorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [viewCount, setViewCount] = useState<number | null>(null)

  const [currentFounderUsername, setCurrentFounderUsername] = useState<string | null>(null)
  const [currentFounderUserId, setCurrentFounderUserId] = useState<string | null>(null)
  const [connectorUserId, setConnectorUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [alreadyRequested, setAlreadyRequested] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      const { data: cp } = await supabase
        .from('connector_profiles').select('*').eq('username', username).single()

      if (cp) {
        setProfile(cp)
        setConnectorUserId(cp.user_id)
        // Track view
        supabase.from('profile_views').insert([{ username, profile_type: 'connector' }]).then(() => {})
        // View count
        const { count } = await supabase
          .from('profile_views').select('id', { count: 'exact', head: true })
          .eq('username', username).eq('profile_type', 'connector')
        setViewCount(count ?? 0)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user && cp) {
        const { data: fp } = await supabase
          .from('profiles').select('username').eq('user_id', user.id).single()
        if (fp) {
          setCurrentFounderUsername(fp.username)
          setCurrentFounderUserId(user.id)
          const { data: existing } = await supabase
            .from('intro_requests').select('id')
            .eq('founder_user_id', user.id).eq('connector_user_id', cp.user_id).maybeSingle()
          setAlreadyRequested(!!existing)
        }
      }

      setLoading(false)
    }
    load()

    if (searchParams.get('request') === '1') setShowModal(true)
  }, [username, searchParams])

  const handleSendRequest = async () => {
    if (!message.trim()) { setRequestError('Please write a message'); return }
    if (!currentFounderUserId || !connectorUserId || !currentFounderUsername || !profile) {
      setRequestError('You need to be logged in as a founder'); return
    }
    setSending(true)
    setRequestError('')
    try {
      const supabase = createClient()
      const { data: inserted, error } = await supabase.from('intro_requests').insert([{
        founder_user_id: currentFounderUserId,
        connector_user_id: connectorUserId,
        founder_username: currentFounderUsername,
        connector_username: username,
        message: message.trim(),
        status: 'pending',
      }]).select('id').single()
      if (error) throw error

      // Notify connector (with auth token)
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          user_id: connectorUserId,
          type: 'new_request',
          title: `New intro request from ${currentFounderUsername}`,
          body: message.trim().slice(0, 120),
          request_id: inserted?.id ?? null,
        }),
      })

      setSent(true)
      setAlreadyRequested(true)
      setTimeout(() => setShowModal(false), 2000)
    } catch (err: unknown) {
      setRequestError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const handleRequestClick = () => {
    if (!currentFounderUsername) {
      router.push(`/login?next=/c/${username}?request=1`)
      return
    }
    setShowModal(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold mb-3">Connector not found</h1>
        <p className="text-gray-400 mb-6">No connector at <span className="font-mono text-white">/c/{username}</span></p>
        <Link href="/connectors" className="px-6 py-3 bg-white text-black font-bold rounded-xl">Browse connectors</Link>
      </div>
    </div>
  )

  const expertiseTags = profile.expertise?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  const helpsTags = profile.helps_with?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  const helpsLabels = helpsTags.map(v => HELPS_WITH_OPTIONS.find(o => o.value === v)?.label ?? v)
  const linksArray = profile.links?.split(',').map(s => s.trim()).filter(Boolean) ?? []

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg bg-zinc-900 border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl">
            {sent ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold mb-2">Request sent!</h3>
                <p className="text-gray-400">{profile.name.split(' ')[0]} will review your request.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Request intro from {profile.name.split(' ')[0]}</h3>
                    <p className="text-sm text-gray-400 mt-1">Tell them what you need and why it's a fit.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white ml-4 p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!currentFounderUsername ? (
                  <div className="text-center py-4">
                    <p className="text-gray-400 mb-4">Sign in as a founder to request an intro.</p>
                    <Link href={`/login?next=/c/${username}?request=1`} className="px-6 py-3 bg-white text-black font-bold rounded-xl inline-block">Sign in</Link>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={5}
                      placeholder={`Hi ${profile.name.split(' ')[0]}, I'm building [company] — [one-liner]. I'm looking for [specific ask]. Would love your help with [what specifically].`}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none text-sm leading-relaxed"
                      maxLength={600}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">{message.length}/600</p>
                    {requestError && <p className="text-red-400 text-sm mt-2">{requestError}</p>}
                    <button
                      onClick={handleSendRequest}
                      disabled={sending || !message.trim()}
                      className="w-full mt-4 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
                    >
                      {sending ? 'Sending…' : 'Send Request'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-white/10 bg-black/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={copyLink} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
              {copied
                ? <><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400 text-xs">Copied!</span></>
                : <span className="text-xs">Share</span>
              }
            </button>
            <Link href="/connectors" className="text-xs text-gray-400 hover:text-white transition-colors hidden sm:block">← All connectors</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl sm:text-3xl font-bold text-black flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connector Profile
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-1">{profile.name}</h1>
              <p className="text-gray-400">{profile.bio}</p>
              {viewCount !== null && viewCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">{viewCount} profile views</p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {alreadyRequested ? (
              <div className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium">
                ✓ Request sent
              </div>
            ) : (
              <button
                onClick={handleRequestClick}
                className="px-5 py-2.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm w-full sm:w-auto"
              >
                Request Intro
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3">Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {expertiseTags.length > 0
                ? expertiseTags.map(tag => <Tag key={tag} label={tag} variant="green" />)
                : <p className="text-gray-500 text-sm">Not specified</p>}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3">I Help With</h2>
            <div className="flex flex-wrap gap-2">
              {helpsLabels.length > 0
                ? helpsLabels.map(label => <Tag key={label} label={label} />)
                : <p className="text-gray-500 text-sm">Not specified</p>}
            </div>
          </div>
        </div>

        {profile.portfolio && (
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 mb-5">
            <h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3">Track Record</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{profile.portfolio}</p>
          </div>
        )}

        {linksArray.length > 0 && (
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 mb-10">
            <h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-3">Connect</h2>
            <div className="flex flex-wrap gap-2">
              {linksArray.map(link => (
                <a key={link} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/20 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ))}
            </div>
          </div>
        )}

        {!currentFounderUsername && (
          <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 text-center">
            <p className="text-lg font-semibold mb-2">Want {profile.name.split(' ')[0]}'s help?</p>
            <p className="text-gray-400 mb-5 text-sm">Create a founder profile and send a structured intro request in minutes.</p>
            <Link href="/signup" className="inline-block px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all">
              Join as Founder — Free
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
