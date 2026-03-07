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
}

type NotionSnapshot = {
  rendered_html: string
  page_title: string
  word_count: number
  synced_at: string
  version: number
}

type Tab = 'overview' | 'snapshot' | 'updates' | 'ask'

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

function TabBtn({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${active
        ? 'text-white bg-white/10'
        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      {label}
      {badge && (
        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{badge}</span>
      )}
    </button>
  )
}

export default function FounderPublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [blurbCopied, setBlurbCopied] = useState(false)
  const [viewCount, setViewCount] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('overview')

  // Auth
  const [isOwner, setIsOwner] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isFounder, setIsFounder] = useState(false)

  // Notion snapshot
  const [snapshot, setSnapshot] = useState<NotionSnapshot | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(false)

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
          // Check if viewer is a founder
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

  // Load snapshot when Snapshot tab opened
  useEffect(() => {
    if (tab !== 'snapshot' || snapshot !== null || snapshotLoading) return
    const load = async () => {
      setSnapshotLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('notion_snapshots')
        .select('rendered_html, page_title, word_count, synced_at, version')
        .eq('founder_username', username)
        .eq('is_current', true)
        .single()
      setSnapshot(data ?? null)
      setSnapshotLoading(false)
    }
    load()
  }, [tab, username, snapshot, snapshotLoading])

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
              <Link href="/builder" className="text-emerald-500 hover:text-emerald-400 transition-colors underline underline-offset-2 text-xs">
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
                <Link href="/builder" className="px-4 py-2 bg-white/10 border border-white/20 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-white/15 transition-all">
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

          {/* ── Left column — main content ── */}
          <div className="min-w-0">
            {/* Company header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Startup Profile
                </span>
                {profile.stage && (
                  <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-gray-400">{profile.stage}</span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">{profile.company_name}</h1>
              <p className="text-xl text-gray-400 font-light leading-relaxed">{profile.one_liner}</p>
            </div>

            {/* Metrics row */}
            {hasMetrics && (
              <div className="flex flex-wrap gap-2 mb-6">
                {profile.mrr && <MetricChip label="MRR" value={profile.mrr} />}
                {profile.users_count && <MetricChip label="Users" value={profile.users_count} />}
                {profile.growth && <MetricChip label="Growth" value={profile.growth} />}
                {viewCount !== null && viewCount > 0 && <MetricChip label="Profile views" value={viewCount.toString()} />}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/10 mb-6 overflow-x-auto pb-px">
              <TabBtn label="Overview" active={tab === 'overview'} onClick={() => setTab('overview')} />
              <TabBtn label="Snapshot" active={tab === 'snapshot'} onClick={() => setTab('snapshot')} badge={snapshot ? 'N' : undefined} />
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

            {/* ── Tab: Snapshot (Notion) ── */}
            {tab === 'snapshot' && (
              <div>
                {snapshotLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : snapshot ? (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-sm font-medium text-white">{snapshot.page_title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{snapshot.word_count} words · synced {timeAgo(snapshot.synced_at)} · v{snapshot.version}</p>
                      </div>
                      {isOwner && (
                        <Link href="/settings/integrations" className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors">
                          Manage →
                        </Link>
                      )}
                    </div>
                    <div
                      className="notion-render prose-notion"
                      dangerouslySetInnerHTML={{ __html: snapshot.rendered_html }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.459 4.208c.746.606 1.026.56 2.428.469l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466L4.459 4.208zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933l3.222-.187z"/>
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">No Notion snapshot yet</p>
                    {isOwner ? (
                      <>
                        <p className="text-gray-600 text-xs mb-4">Connect Notion and sync your investor update to share it here.</p>
                        <Link href="/settings/integrations" className="px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm inline-block">
                          Connect Notion →
                        </Link>
                      </>
                    ) : (
                      <p className="text-gray-600 text-xs">This founder hasn&apos;t connected a Notion page yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Updates (GitHub) ── */}
            {tab === 'updates' && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm mb-1">GitHub integration coming soon</p>
                <p className="text-gray-600 text-xs">Commits, activity, and releases — all inside Warmchain.</p>
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

                {/* CTA for founders/visitors */}
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

          {/* ── Right column — Fast Scan panel ── */}
          <div className="lg:sticky lg:top-[73px] self-start space-y-3">
            {/* 30-sec card */}
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
              </div>

              {/* Copy Blurb */}
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

            {/* Request Intro CTA */}
            {!isOwner && (
              <Link
                href="/connectors"
                className="block w-full py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm text-center"
              >
                Request Intro via Connector
              </Link>
            )}

            {/* Notion status badge (if snapshot exists) */}
            {snapshot && (
              <button
                onClick={() => setTab('snapshot')}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
              >
                <div className="w-6 h-6 rounded bg-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M4.459 4.208c.746.606 1.026.56 2.428.469l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466L4.459 4.208zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933l3.222-.187z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Notion snapshot</p>
                  <p className="text-xs text-gray-500">{timeAgo(snapshot.synced_at)}</p>
                </div>
                <svg className="w-4 h-4 text-gray-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
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
