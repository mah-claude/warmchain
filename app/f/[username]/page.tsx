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
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10">
      <span className="text-lg font-bold text-emerald-400">{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  )
}

export default function FounderPublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [viewCount, setViewCount] = useState<number | null>(null)

  // Auth state
  const [isOwner, setIsOwner] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      // Fetch profile and auth in parallel
      const [profileResult, userResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('username', username).single(),
        supabase.auth.getUser(),
      ])

      const data = profileResult.data
      const user = userResult.data.user

      if (user) {
        setIsLoggedIn(true)
        // Check ownership: is this user's founder profile the one being viewed?
        if (data && data.user_id === user.id) {
          setIsOwner(true)
        }
      }

      if (data) {
        setProfile(data)
        // Track view (fire and forget) — skip for owner to keep counts accurate
        if (!user || data.user_id !== user.id) {
          supabase.from('profile_views').insert([{ username, profile_type: 'founder' }]).then(() => {})
          // Page analytics
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: `/f/${username}`, referrer: document.referrer, is_authenticated: !!user }),
          }).catch(() => {})
        }
        // Get view count
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

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold mb-3">Profile not found</h1>
        <p className="text-gray-400 mb-6">No founder at <span className="font-mono text-white">/f/{username}</span></p>
        <Link href="/" className="px-6 py-3 bg-white text-black font-bold rounded-xl">Go home</Link>
      </div>
    </div>
  )

  const linksArray = profile.links?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  const needsList = profile.needs?.split(',').filter(Boolean).map(v => NEEDS_OPTIONS.find(o => o.value === v)?.label ?? v) ?? []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: profile.company_name,
    description: profile.one_liner,
    url: `https://warmchain.co/f/${profile.username}`,
    ...(profile.stage && { foundingDate: profile.stage }),
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Owner banner */}
      {isOwner && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 text-sm">
            <span className="text-emerald-400 font-medium">
              👁 This is how others see your profile
            </span>
            <div className="flex items-center gap-3">
              <Link href="/builder" className="text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-2 text-xs">
                Edit profile
              </Link>
              <Link href="/dashboard" className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-all">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-white/10 bg-black/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {isOwner ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
                  ← Dashboard
                </Link>
                <Link href="/builder" className="px-4 py-2 bg-white/10 border border-white/20 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-white/15 transition-all">
                  Edit Profile
                </Link>
              </>
            ) : (
              <>
                <button onClick={copyLink} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                  {copied
                    ? <><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400 text-xs">Copied!</span></>
                    : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span className="hidden sm:inline text-xs">Share</span></>
                  }
                </button>
                {!isLoggedIn && (
                  <Link href="/signup" className="px-4 py-2 bg-white text-black text-xs sm:text-sm font-semibold rounded-full hover:bg-emerald-400 transition-all">
                    Create yours
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Startup Profile
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-3 tracking-tight">{profile.company_name}</h1>
          <p className="text-xl sm:text-2xl text-gray-400 font-light leading-relaxed">{profile.one_liner}</p>

          {/* Metrics pills */}
          {(profile.mrr || profile.users_count || profile.growth || profile.stage) && (
            <div className="flex flex-wrap gap-3 mt-6">
              {profile.stage && <StatPill label="Stage" value={profile.stage} />}
              {profile.mrr && <StatPill label="MRR" value={profile.mrr} />}
              {profile.users_count && <StatPill label="Users" value={profile.users_count} />}
              {profile.growth && <StatPill label="Growth" value={profile.growth} />}
              {viewCount !== null && viewCount > 0 && <StatPill label="Views" value={viewCount.toString()} />}
            </div>
          )}
        </div>

        {/* The Ask */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border border-emerald-500/20 mb-6">
          <h2 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            The Ask
          </h2>
          <p className="text-lg sm:text-xl text-white leading-relaxed whitespace-pre-line font-light">{profile.ask}</p>

          {needsList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {needsList.map(n => (
                <span key={n} className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">{n}</span>
              ))}
            </div>
          )}
        </div>

        {/* Traction */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
          <h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Traction</h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{profile.traction}</p>
        </div>

        {/* Team */}
        {profile.team && (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
            <h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Team</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{profile.team}</p>
          </div>
        )}

        {/* Links */}
        {linksArray.length > 0 && (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-10">
            <h2 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Links</h2>
            <div className="flex flex-wrap gap-2">
              {linksArray.map(link => (
                <a key={link} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/20 transition-all">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA — only for logged-out visitors */}
        {!isLoggedIn && (
          <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 text-center">
            <p className="text-lg font-semibold mb-2">Create your own startup profile</p>
            <p className="text-gray-400 text-sm mb-5">One link with everything connectors need. Free during beta.</p>
            <Link href="/signup" className="inline-block px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all">
              Get started — Free
            </Link>
          </div>
        )}

        {/* Logged-in non-owner: prompt to browse connectors */}
        {isLoggedIn && !isOwner && (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-3">Looking to make warm intros?</p>
            <Link href="/connectors" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
              Browse Connectors →
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 mt-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <Link href="/" className="font-semibold text-white hover:text-emerald-400 transition-colors">Warmchain</Link>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/connectors" className="hover:text-white transition-colors">Connectors</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
