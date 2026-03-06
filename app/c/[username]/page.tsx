'use client'

import { use, useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ConnectorProfile, HELPS_WITH_OPTIONS, ASK_TYPE_OPTIONS, TIMELINE_OPTIONS } from '@/lib/types'

function Tag({ label, variant = 'default' }: { label: string; variant?: 'default' | 'green' }) {
  return variant === 'green'
    ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{label}</span>
    : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{label}</span>
}

function ConnectorProfileInner({ username }: { username: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [profile, setProfile] = useState<ConnectorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Auth / visitor state
  const [isOwner, setIsOwner] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentFounderUsername, setCurrentFounderUsername] = useState<string | null>(null)
  const [currentFounderUserId, setCurrentFounderUserId] = useState<string | null>(null)
  const [connectorUserId, setConnectorUserId] = useState<string | null>(null)

  // Modal / request state
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState(1) // 1 = type+target, 2 = why+blurb+timeline
  const [askType, setAskType] = useState('')
  const [targetProfile, setTargetProfile] = useState('')
  const [whyMe, setWhyMe] = useState('')
  const [forwardableBlurb, setForwardableBlurb] = useState('')
  const [timeline, setTimeline] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [alreadyRequested, setAlreadyRequested] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      const [cpResult, userResult] = await Promise.all([
        supabase.from('connector_profiles').select('*').eq('username', username).single(),
        supabase.auth.getUser(),
      ])

      const cp = cpResult.data
      const user = userResult.data.user

      if (cp) {
        setProfile(cp)
        setConnectorUserId(cp.user_id)

        if (user) {
          setIsLoggedIn(true)

          // Check if this user owns the connector profile
          if (cp.user_id === user.id) {
            setIsOwner(true)
            // Fetch unread notification count for the owner
            const { count } = await supabase
              .from('notifications')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('read', false)
            setUnreadCount(count ?? 0)
          } else {
            // Check if this user is a founder who can request intros
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
        }

        // No view tracking for connector profiles — only founders track views
      }

      setLoading(false)
    }
    load()

    if (searchParams.get('request') === '1') setShowModal(true)
  }, [username, searchParams])

  const handleSendRequest = async () => {
    if (!askType) { setRequestError('Please select what type of intro you need'); return }
    if (!targetProfile.trim()) { setRequestError('Please describe who you are looking to meet'); return }
    if (!whyMe.trim()) { setRequestError('Please explain why this connector is a good fit'); return }
    if (!currentFounderUserId || !connectorUserId || !currentFounderUsername || !profile) {
      setRequestError('You need to be logged in as a founder'); return
    }
    setSending(true)
    setRequestError('')
    try {
      const supabase = createClient()

      // Compose a formatted message for backwards-compatibility and email preview
      const askLabel = ASK_TYPE_OPTIONS.find(o => o.value === askType)?.label ?? askType
      const timelineLabel = TIMELINE_OPTIONS.find(o => o.value === timeline)?.label ?? timeline
      const composedMessage = [
        `Ask: ${askLabel}`,
        `Target: ${targetProfile.trim()}`,
        `Why you: ${whyMe.trim()}`,
        forwardableBlurb.trim() ? `Forwardable: ${forwardableBlurb.trim()}` : null,
        timelineLabel ? `Timeline: ${timelineLabel}` : null,
      ].filter(Boolean).join('\n')

      // Try insert with structured fields — fall back to message-only if columns don't exist yet
      let inserted: { id: string } | null = null
      const fullPayload = {
        founder_user_id: currentFounderUserId,
        connector_user_id: connectorUserId,
        founder_username: currentFounderUsername,
        connector_username: username,
        message: composedMessage,
        ask_type: askType,
        target_profile: targetProfile.trim(),
        why_me: whyMe.trim(),
        forwardable_blurb: forwardableBlurb.trim() || null,
        timeline: timeline || null,
        status: 'pending',
      }

      const { data: d1, error: e1 } = await supabase
        .from('intro_requests').insert([fullPayload]).select('id').single()
      if (e1) {
        // If structured columns don't exist yet, fall back to basic insert
        if (e1.message?.includes('column') || e1.code === '42703') {
          const { data: d2, error: e2 } = await supabase.from('intro_requests').insert([{
            founder_user_id: currentFounderUserId,
            connector_user_id: connectorUserId,
            founder_username: currentFounderUsername,
            connector_username: username,
            message: composedMessage,
            status: 'pending',
          }]).select('id').single()
          if (e2) throw e2
          inserted = d2
        } else {
          throw e1
        }
      } else {
        inserted = d1
      }

      // Notify connector
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
          body: `${askLabel} — ${targetProfile.trim().slice(0, 100)}`,
          request_id: inserted?.id ?? null,
        }),
      })

      // Send email to connector
      const { data: fp } = await supabase
        .from('profiles').select('company_name').eq('user_id', currentFounderUserId).single()
      if (session?.access_token) {
        fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: 'new_request',
            connector_name: profile.name,
            founder_company: fp?.company_name ?? currentFounderUsername,
            founder_username: currentFounderUsername,
            message: composedMessage,
          }),
        }).catch(() => {})
      }

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
    if (!isLoggedIn) {
      router.push(`/login?next=/c/${username}?request=1`)
      return
    }
    if (!currentFounderUsername) {
      // Logged in but not a founder — redirect to dashboard
      router.push('/dashboard')
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Connector not found</h1>
        <p className="text-gray-500 mb-6">No connector at <span className="font-mono text-gray-800">/c/{username}</span></p>
        <Link href="/connectors" className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">Browse connectors</Link>
      </div>
    </div>
  )

  const expertiseTags = profile.expertise?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  const helpsTags = profile.helps_with?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  const helpsLabels = helpsTags.map(v => HELPS_WITH_OPTIONS.find(o => o.value === v)?.label ?? v)
  const linksArray = profile.links?.split(',').map(s => s.trim()).filter(Boolean) ?? []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    description: profile.bio,
    url: `https://warmchain.co/c/${profile.username}`,
    ...(expertiseTags.length && { knowsAbout: expertiseTags }),
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Owner banner */}
      {isOwner && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 text-sm">
            <span className="text-emerald-700 font-medium">
              👁 This is how founders see your profile
            </span>
            <div className="flex items-center gap-3">
              <Link href="/connector-builder" className="text-emerald-600 hover:text-emerald-700 transition-colors underline underline-offset-2 text-xs">
                Edit profile
              </Link>
              <Link href="/dashboard" className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all">
                {unreadCount > 0 ? `Inbox (${unreadCount})` : 'Dashboard'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Intro request modal — structured 2-step */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg bg-zinc-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
            {sent ? (
              <div className="text-center py-12 px-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold mb-2">Request sent!</h3>
                <p className="text-gray-400">{profile.name.split(' ')[0]} will review your request and respond soon.</p>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-lg font-bold">Request intro from {profile.name.split(' ')[0]}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {[1, 2].map(s => (
                        <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s <= modalStep ? 'bg-emerald-500 w-6' : 'bg-white/20 w-4'}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">Step {modalStep} of 2</span>
                    </div>
                  </div>
                  <button onClick={() => { setShowModal(false); setModalStep(1) }} className="text-gray-500 hover:text-white p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!currentFounderUsername ? (
                  <div className="text-center py-8 px-6">
                    <p className="text-gray-400 mb-4">Sign in as a founder to request an intro.</p>
                    <Link href={`/login?next=/c/${username}?request=1`} className="px-6 py-3 bg-white text-black font-bold rounded-xl inline-block">Sign in</Link>
                  </div>
                ) : modalStep === 1 ? (
                  <div className="p-6 space-y-5">
                    {/* Step 1: Ask type + Target */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What kind of intro do you need?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ASK_TYPE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAskType(opt.value)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${askType === opt.value ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'}`}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Who specifically are you looking to meet?</label>
                      <input
                        type="text"
                        value={targetProfile}
                        onChange={e => setTargetProfile(e.target.value)}
                        placeholder="e.g. B2B SaaS angels in NYC, Series A fintech funds"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                        maxLength={150}
                      />
                    </div>
                    {requestError && <p className="text-red-400 text-sm">{requestError}</p>}
                    <button
                      type="button"
                      onClick={() => { if (!askType) { setRequestError('Select an intro type'); return }; if (!targetProfile.trim()) { setRequestError('Describe who you want to meet'); return }; setRequestError(''); setModalStep(2) }}
                      className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
                    >
                      Continue →
                    </button>
                  </div>
                ) : (
                  <div className="p-6 space-y-5">
                    {/* Step 2: Why me + Blurb + Timeline */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Why is {profile.name.split(' ')[0]} the right person?</label>
                      <textarea
                        value={whyMe}
                        onChange={e => setWhyMe(e.target.value)}
                        rows={3}
                        placeholder={`e.g. You invested in DevFlow which targets the same market, and I saw your post about B2B SaaS go-to-market.`}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none text-sm leading-relaxed"
                        maxLength={300}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Forwardable blurb <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                      <p className="text-xs text-gray-500 mb-2">2-3 sentences {profile.name.split(' ')[0]} can copy-paste when making the intro.</p>
                      <textarea
                        value={forwardableBlurb}
                        onChange={e => setForwardableBlurb(e.target.value)}
                        rows={3}
                        placeholder="[Company] builds X for Y. They're at $XXk MRR and growing Z% MoM. They're raising pre-seed and looking to meet angels focused on [space]."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none text-sm leading-relaxed"
                        maxLength={400}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Timeline</label>
                      <div className="flex flex-wrap gap-2">
                        {TIMELINE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTimeline(opt.value)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${timeline === opt.value ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {requestError && <p className="text-red-400 text-sm">{requestError}</p>}
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setModalStep(1); setRequestError('') }}
                        className="px-5 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all text-sm">
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSendRequest}
                        disabled={sending}
                        className="flex-1 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
                      >
                        {sending ? 'Sending…' : 'Send Request'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {isOwner ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:flex">
                  ← Dashboard
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/connector-builder" className="px-4 py-2 bg-gray-100 border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-full hover:bg-gray-200 transition-all">
                  Edit Profile
                </Link>
              </>
            ) : (
              <>
                <button onClick={copyLink} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
                  {copied
                    ? <><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-emerald-600 text-xs font-medium">Copied!</span></>
                    : <span className="text-xs">Share</span>
                  }
                </button>
                <Link href="/connectors" className="text-xs text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">← All connectors</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white flex-shrink-0">
                {profile.name.charAt(0)}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connector
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{profile.name}</h1>
                <p className="text-gray-500 leading-relaxed">{profile.bio}</p>
              </div>
            </div>

            {/* Request button — only for non-owners */}
            {!isOwner && (
              <div className="flex-shrink-0">
                {alreadyRequested ? (
                  <div className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium">
                    ✓ Request sent
                  </div>
                ) : (
                  <button
                    onClick={handleRequestClick}
                    className="px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all text-sm w-full sm:w-auto shadow-sm"
                  >
                    Request Intro
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {expertiseTags.length > 0
                ? expertiseTags.map(tag => <Tag key={tag} label={tag} variant="green" />)
                : <p className="text-gray-400 text-sm">Not specified</p>}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">I Help With</h2>
            <div className="flex flex-wrap gap-2">
              {helpsLabels.length > 0
                ? helpsLabels.map(label => <Tag key={label} label={label} />)
                : <p className="text-gray-400 text-sm">Not specified</p>}
            </div>
          </div>
        </div>

        {profile.portfolio && (
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm mb-4">
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Track Record</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.portfolio}</p>
          </div>
        )}

        {linksArray.length > 0 && (
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm mb-6">
            <h2 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Connect</h2>
            <div className="flex flex-wrap gap-2">
              {linksArray.map(link => (
                <a key={link} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA for logged-out visitors only */}
        {!isLoggedIn && (
          <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-center shadow-md">
            <p className="text-xl font-bold text-white mb-2">Want {profile.name.split(' ')[0]}'s help?</p>
            <p className="text-emerald-100 mb-5 text-sm">Create a founder profile and send a structured intro request in minutes.</p>
            <Link href="/signup" className="inline-block px-8 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
              Join as Founder — Free
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ConnectorPublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConnectorProfileInner username={username} />
    </Suspense>
  )
}
