'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { NEEDS_OPTIONS } from '@/lib/types'

type Profile = {
  username: string
  company_name: string
  one_liner: string
  stage: string
  traction: string
  ask: string
  team: string | null
  links: string | null
  needs: string | null
  mrr: string | null
  users_count: string | null
  growth: string | null
  user_id: string
  github_repo: string | null
  // integrations
  yc_batch: string | null
  linkedin_url: string | null
  notion_url: string | null
  pitch_url: string | null
  docsend_url: string | null
  linear_url: string | null
  producthunt_url: string | null
}

type Tab = 'overview' | 'deck' | 'updates' | 'ask'

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
      <span className="text-base font-bold text-emerald-400">{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  )
}

function TabBtn({ label, active, onClick, dot }: { label: string; active: boolean; onClick: () => void; dot?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
        active ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      {label}
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
    </button>
  )
}

// ── Integration icon links ─────────────────────────────────────────────────
function IntegrationLinks({ profile }: { profile: Profile }) {
  const links = [
    profile.linkedin_url && {
      url: profile.linkedin_url, label: 'LinkedIn',
      icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
    },
    profile.github_repo && {
      url: `https://github.com/${profile.github_repo}`, label: 'GitHub',
      icon: <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />,
    },
    profile.producthunt_url && {
      url: profile.producthunt_url, label: 'Product Hunt',
      icon: <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 000-3.6M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m1.604 14.4H10.2v3.6H7.8V6h5.804a4.2 4.2 0 010 8.4" />,
    },
    profile.linear_url && {
      url: profile.linear_url, label: 'Roadmap',
      icon: <path d="M3.526 10.028L13.97 20.472l-.338.326A10.5 10.5 0 013.526 10.028zm-.5-1.044a10.5 10.5 0 0012.432 12.432L3.026 8.984zm1.327-2.47l13.13 13.13a10.5 10.5 0 00-13.13-13.13zm1.413-1.061A10.5 10.5 0 0120.05 20.233L5.766 5.453zm2.062-1.113L20.49 18.51A10.5 10.5 0 007.828 4.34zm2.46-1.065L20.875 14.85a10.5 10.5 0 00-10.587-11.575zm3.12-.607l8.672 8.672A10.5 10.5 0 0013.408 3.668zm3.902-.08a10.5 10.5 0 014.97 4.956L17.31 3.588z" />,
    },
  ].filter(Boolean) as { url: string; label: string; icon: React.ReactNode }[]

  if (!links.length) return null

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {links.map(({ url, label, icon }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/8 transition-all text-xs text-gray-400 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            {icon}
          </svg>
          {label}
        </a>
      ))}
    </div>
  )
}

// ── Deck display ───────────────────────────────────────────────────────────
function DeckView({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
  const [embedError, setEmbedError] = useState(false)

  // Priority: Pitch (embeddable) > Notion (try embed) > Docsend (link only)
  const pitchUrl = profile.pitch_url
  const notionUrl = profile.notion_url
  const docsendUrl = profile.docsend_url

  const hasDeck = pitchUrl || notionUrl || docsendUrl

  if (!hasDeck) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm mb-1">No deck connected</p>
        {isOwner ? (
          <>
            <p className="text-gray-600 text-xs mb-4">Connect Notion, Pitch, or Docsend from your integrations.</p>
            <Link href="/settings/integrations" className="px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm inline-block">
              Add deck →
            </Link>
          </>
        ) : (
          <p className="text-gray-600 text-xs">This founder hasn&apos;t connected a deck yet.</p>
        )}
      </div>
    )
  }

  // Try Pitch embed first (they officially support embeds)
  if (pitchUrl && !embedError) {
    // Convert pitch.com/public/... to embed URL if needed
    const embedSrc = pitchUrl.replace('pitch.com/public/', 'pitch.com/embed/')
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pitch deck</p>
          <a href={pitchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Open in Pitch ↗
          </a>
        </div>
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedSrc}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            onError={() => setEmbedError(true)}
          />
        </div>
      </div>
    )
  }

  // Notion — try embed
  if (notionUrl && !embedError) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Notion page</p>
          <a href={notionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Open in Notion ↗
          </a>
        </div>
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ paddingBottom: '75%' }}>
          <iframe
            src={notionUrl}
            className="absolute inset-0 w-full h-full bg-white"
            onError={() => setEmbedError(true)}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">If the page doesn&apos;t load, make sure &ldquo;Share to web&rdquo; is enabled in Notion.</p>
      </div>
    )
  }

  // Docsend or fallback — just a prominent link
  const deckUrl = docsendUrl ?? notionUrl ?? pitchUrl ?? ''
  const deckLabel = docsendUrl ? 'Docsend' : notionUrl ? 'Notion' : 'Pitch'
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </div>
      <p className="text-gray-300 text-sm font-medium mb-1">Investor deck on {deckLabel}</p>
      <p className="text-gray-500 text-xs mb-5">Opens in a new tab</p>
      <a
        href={deckUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm inline-block"
      >
        View deck ↗
      </a>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function FounderPublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [blurbCopied, setBlurbCopied] = useState(false)
  const [viewCount, setViewCount] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('overview')

  const [isOwner, setIsOwner] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isFounder, setIsFounder] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [profileResult, userResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('username', username).single(),
        supabase.auth.getUser(),
      ])
      const data = profileResult.data
      const user = userResult.data.user
      if (user) {
        setIsLoggedIn(true)
        if (data && data.user_id === user.id) {
          setIsOwner(true)
        } else {
          const { data: fp } = await supabase.from('profiles').select('username').eq('user_id', user.id).single()
          if (fp) setIsFounder(true)
        }
      }
      if (data) {
        setProfile(data)
        if (!user || data.user_id !== user.id) {
          supabase.from('profile_views').insert([{ username, profile_type: 'founder' }]).then(() => {})
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: `/f/${username}`, referrer: document.referrer, is_authenticated: !!user }),
          }).catch(() => {})
        }
        const { count } = await supabase
          .from('profile_views')
          .select('id', { count: 'exact', head: true })
          .eq('username', username)
          .eq('profile_type', 'founder')
        setViewCount(count ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [username])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyBlurb = () => {
    if (!profile) return
    const blurb = [
      `${profile.company_name} — ${profile.one_liner}`,
      profile.stage ? `Stage: ${profile.stage}` : null,
      profile.mrr ? `MRR: ${profile.mrr}` : null,
      profile.growth ? `Growth: ${profile.growth}` : null,
      profile.ask,
      `\nMore: https://warmchain.co/f/${username}`,
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(blurb)
    setBlurbCopied(true)
    setTimeout(() => setBlurbCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-white mb-3">Profile not found</h1>
        <p className="text-gray-500 mb-6">No founder at <span className="font-mono text-gray-400">/f/{username}</span></p>
        <Link href="/" className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors">Go home</Link>
      </div>
    </div>
  )

  const needsList = profile.needs?.split(',').filter(Boolean).map(v => NEEDS_OPTIONS.find(o => o.value === v)?.label ?? v) ?? []
  const hasMetrics = !!(profile.mrr || profile.users_count || profile.growth || profile.stage)
  const hasDeck = !!(profile.pitch_url || profile.notion_url || profile.docsend_url)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: profile.company_name,
    description: profile.one_liner,
    url: `https://warmchain.co/f/${profile.username}`,
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Owner banner */}
      {isOwner && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/50 px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 text-sm">
            <span className="text-emerald-400 font-medium text-xs">
              👁 Investor view — this is how connectors see your profile
            </span>
            <div className="flex items-center gap-3">
              <Link href="/settings/profile" className="text-emerald-500 hover:text-emerald-400 transition-colors underline underline-offset-2 text-xs">
                Edit profile
              </Link>
              <Link href="/settings/integrations" className="text-emerald-500 hover:text-emerald-400 transition-colors text-xs">
                Integrations
              </Link>
              <Link href="/dashboard" className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-all">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {isOwner ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors hidden sm:block">← Dashboard</Link>
                <Link href="/settings/profile" className="px-4 py-2 bg-white/10 border border-white/20 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-white/15 transition-all">
                  Edit Profile
                </Link>
              </>
            ) : (
              <>
                <button onClick={copyLink} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                  {copied
                    ? <><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400 text-xs font-medium">Copied!</span></>
                    : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span className="hidden sm:inline text-xs">Share</span></>
                  }
                </button>
                {!isLoggedIn && (
                  <Link href="/signup" className="px-4 py-2 bg-emerald-500 text-black text-xs sm:text-sm font-semibold rounded-full hover:bg-emerald-400 transition-all">
                    Create yours
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">

          {/* ── Left column ── */}
          <div className="min-w-0">
            {/* Company header */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Startup Profile
                </span>
                {profile.stage && (
                  <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-gray-400">{profile.stage}</span>
                )}
                {/* YC badge */}
                {profile.yc_batch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-bold">
                    YC {profile.yc_batch}
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">{profile.company_name}</h1>
              <p className="text-xl text-gray-400 font-light leading-relaxed">{profile.one_liner}</p>
            </div>

            {/* Metrics row */}
            {hasMetrics && (
              <div className="flex flex-wrap gap-2 mb-5">
                {profile.mrr && <MetricChip label="MRR" value={profile.mrr} />}
                {profile.users_count && <MetricChip label="Users" value={profile.users_count} />}
                {profile.growth && <MetricChip label="Growth" value={profile.growth} />}
                {viewCount !== null && viewCount > 0 && <MetricChip label="Profile views" value={viewCount.toString()} />}
              </div>
            )}

            {/* Integration links */}
            <IntegrationLinks profile={profile} />

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/10 mb-6 overflow-x-auto pb-px">
              <TabBtn label="Overview" active={tab === 'overview'} onClick={() => setTab('overview')} />
              {hasDeck && <TabBtn label="Deck" active={tab === 'deck'} onClick={() => setTab('deck')} dot />}
              <TabBtn label="Updates" active={tab === 'updates'} onClick={() => setTab('updates')} />
              <TabBtn label="The Ask" active={tab === 'ask'} onClick={() => setTab('ask')} />
            </div>

            {/* ── Tab: Overview ── */}
            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Traction</h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">{profile.traction}</p>
                </div>
                {profile.team && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Team</h2>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">{profile.team}</p>
                  </div>
                )}
                {needsList.length > 0 && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Looking For</h2>
                    <div className="flex flex-wrap gap-2">
                      {needsList.map(n => (
                        <span key={n} className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{n}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Deck ── */}
            {tab === 'deck' && <DeckView profile={profile} isOwner={isOwner} />}

            {/* ── Tab: Updates (GitHub) ── */}
            {tab === 'updates' && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </div>
                {profile.github_repo ? (
                  <>
                    <p className="text-gray-400 text-sm mb-1">GitHub activity</p>
                    <a href={`https://github.com/${profile.github_repo}`} target="_blank" rel="noopener noreferrer"
                      className="text-emerald-400 text-xs font-mono hover:underline">
                      github.com/{profile.github_repo} ↗
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-1">No GitHub connected</p>
                    {isOwner && (
                      <Link href="/settings/integrations" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                        Add GitHub →
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Tab: The Ask ── */}
            {tab === 'ask' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/60 to-green-900/40 border border-emerald-500/20">
                  <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    The Ask
                  </h2>
                  <p className="text-lg text-white leading-relaxed whitespace-pre-line">{profile.ask}</p>
                  {needsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {needsList.map(n => (
                        <span key={n} className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{n}</span>
                      ))}
                    </div>
                  )}
                </div>
                {!isOwner && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    {isLoggedIn && isFounder ? (
                      <>
                        <p className="text-gray-400 text-sm mb-3">Know someone who could help?</p>
                        <Link href="/connectors" className="px-5 py-2.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm inline-block">
                          Find a Connector →
                        </Link>
                      </>
                    ) : !isLoggedIn ? (
                      <>
                        <p className="text-gray-400 text-sm mb-3">Create your own startup profile — free during beta.</p>
                        <Link href="/signup" className="px-5 py-2.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm inline-block">
                          Get started
                        </Link>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right column — Fast Scan ── */}
          <div className="lg:sticky lg:top-[73px] self-start space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">30-sec scan</span>
                <span className="text-xs text-gray-600">Fast overview</span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Company</p>
                  <p className="text-sm font-semibold text-white">{profile.company_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">What</p>
                  <p className="text-sm text-gray-300 leading-snug">{profile.one_liner}</p>
                </div>
                {profile.stage && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Stage</p>
                    <p className="text-sm text-gray-300">{profile.stage}</p>
                  </div>
                )}
                {hasMetrics && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Metrics</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {profile.mrr && <MetricChip label="MRR" value={profile.mrr} />}
                      {profile.users_count && <MetricChip label="Users" value={profile.users_count} />}
                      {profile.growth && <MetricChip label="Growth" value={profile.growth} />}
                    </div>
                  </div>
                )}
                {needsList.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Looking for</p>
                    <div className="flex flex-wrap gap-1">
                      {needsList.slice(0, 3).map(n => (
                        <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{n}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Connected integrations quick list */}
                {(profile.yc_batch || profile.linkedin_url || profile.producthunt_url || hasDeck) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Verified links</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.yc_batch && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20 font-medium">
                          YC {profile.yc_batch}
                        </span>
                      )}
                      {hasDeck && (
                        <button onClick={() => setTab('deck')} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/15 hover:bg-white/10 transition-all">
                          Deck ↗
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={copyBlurb}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-gray-400 hover:text-white hover:border-white/30 transition-all text-xs font-medium"
                >
                  {blurbCopied ? (
                    <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400">Blurb copied!</span></>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy Blurb</>
                  )}
                </button>
              </div>
            </div>

            {!isOwner && (
              <Link
                href="/connectors"
                className="block w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm text-center"
              >
                Request Intro via Connector
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 px-6 mt-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <Link href="/" className="font-semibold text-gray-400 hover:text-white transition-colors">Warmchain</Link>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-gray-400 transition-colors">About</Link>
            <Link href="/connectors" className="hover:text-gray-400 transition-colors">Connectors</Link>
            <Link href="/faq" className="hover:text-gray-400 transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
