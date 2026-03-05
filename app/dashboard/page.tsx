'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/lib/supabase'
import { Profile, ConnectorProfile, IntroRequest, Notification, NEEDS_OPTIONS, HELPS_WITH_OPTIONS, EXPERTISE_OPTIONS } from '@/lib/types'

// ─── Shared helpers ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'emerald' }: { label: string; value: string | number; sub?: string; color?: 'emerald' | 'yellow' | 'blue' | 'rose' }) {
  const colors = {
    emerald: 'text-emerald-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    rose: 'text-rose-400',
  }
  return (
    <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col gap-1">
      <span className={`text-3xl font-bold ${colors[color]}`}>{value}</span>
      <span className="text-sm font-medium text-white">{label}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    declined: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls[status] ?? cls.pending}`}>
      {status}
    </span>
  )
}

function Tab({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
        active
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

type ChartPoint = { date: string; value: number }
type CommitData = { sha: string; message: string; author: string; date: string; url: string }
type RepoData = { open_issues: number; stars: number; last_push: string; description: string | null }

// ─── GitHub helpers ────────────────────────────────────────────────────────────

async function fetchGithubData(repo: string): Promise<{ commits: CommitData[]; repoInfo: RepoData | null }> {
  try {
    const [commitsRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}/commits?per_page=10`),
      fetch(`https://api.github.com/repos/${repo}`),
    ])
    const commits: CommitData[] = commitsRes.ok
      ? (await commitsRes.json()).map((c: { sha: string; commit: { message: string; author: { name: string; date: string } }; html_url: string }) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split('\n')[0].slice(0, 72),
          author: c.commit.author.name,
          date: c.commit.author.date,
          url: c.html_url,
        }))
      : []
    const repoInfo: RepoData | null = repoRes.ok
      ? (() => {
          const r = repoRes.json() as unknown as Promise<{ open_issues_count: number; stargazers_count: number; pushed_at: string; description: string | null }>
          return r.then(d => ({ open_issues: d.open_issues_count, stars: d.stargazers_count, last_push: d.pushed_at, description: d.description })) as unknown as RepoData
        })()
      : null
    return { commits, repoInfo: repoInfo ? await (repoInfo as unknown as Promise<RepoData>) : null }
  } catch {
    return { commits: [], repoInfo: null }
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Notification panel ────────────────────────────────────────────────────────

function NotifPanel({
  notifications, unread, onClose, onMarkRead,
}: {
  notifications: Notification[]
  unread: number
  onClose: () => void
  onMarkRead: () => void
}) {
  return (
    <div className="absolute right-0 top-12 w-80 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <span className="text-sm font-semibold">Notifications {unread > 0 && <span className="ml-1 text-xs text-emerald-400">({unread} unread)</span>}</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0
          ? <p className="p-4 text-sm text-gray-500 text-center">No notifications yet</p>
          : notifications.map(n => (
            <div key={n.id} className={`p-4 border-b border-white/5 last:border-0 ${!n.read ? 'bg-white/[0.02]' : ''}`}>
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-2 -mt-0.5" />}
              <p className="text-sm font-medium text-white mb-0.5">{n.title}</p>
              <p className="text-xs text-gray-400 line-clamp-2">{n.body}</p>
              <p className="text-xs text-gray-600 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
            </div>
          ))
        }
      </div>
      {unread > 0 && (
        <div className="p-3 border-t border-white/10">
          <button onClick={onMarkRead} className="w-full text-xs text-gray-400 hover:text-white transition-colors text-center">
            Mark all as read
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Shared Nav ────────────────────────────────────────────────────────────────

function DashNav({
  badge, roleLabel, notifications, onSignOut,
}: {
  badge: string
  roleLabel: string
  notifications: Notification[]
  onSignOut: () => void
}) {
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState(notifications)
  const unread = notifs.filter(n => !n.read).length

  useEffect(() => { setNotifs(notifications) }, [notifications])

  const markRead = async () => {
    const ids = notifs.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await createClient().from('notifications').update({ read: true }).in('id', ids)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <nav className="border-b border-white/10 bg-black/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
        <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden sm:block text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-lg">{roleLabel}</span>
          <div className="relative">
            <button
              onClick={() => { setShowNotifs(v => !v); if (!showNotifs) markRead() }}
              className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {showNotifs && (
              <NotifPanel
                notifications={notifs}
                unread={unread}
                onClose={() => setShowNotifs(false)}
                onMarkRead={markRead}
              />
            )}
          </div>
          <span className="hidden sm:block text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">{badge}</span>
          <button onClick={onSignOut} className="text-sm text-gray-400 hover:text-white transition-colors">Sign out</button>
        </div>
      </div>
    </nav>
  )
}

// ─── Custom chart tooltip ──────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400">{label}</p>
      <p className="text-emerald-400 font-bold">{payload[0].value}</p>
    </div>
  )
}

// ─── Founder Dashboard ─────────────────────────────────────────────────────────

function FounderDashboard({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'network' | 'activity'>('overview')
  const [requests, setRequests] = useState<(IntroRequest & { connector_name?: string; connector_bio?: string; connector_expertise?: string })[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [viewCount, setViewCount] = useState(0)
  const [viewsChart, setViewsChart] = useState<ChartPoint[]>([])
  const [requestsChart, setRequestsChart] = useState<ChartPoint[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')
  const [copied, setCopied] = useState(false)
  const [githubCommits, setGithubCommits] = useState<CommitData[]>([])
  const [githubRepo, setGithubRepo] = useState<RepoData | null>(null)

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/f/${profile.username}` : ''

  const load = useCallback(async () => {
    const supabase = createClient()

    // Parallel fetch: requests + views + notifications
    const [reqResult, viewResult, notifResult, viewsRaw] = await Promise.all([
      supabase.from('intro_requests').select('*').eq('founder_username', profile.username).order('created_at', { ascending: false }),
      supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('username', profile.username).eq('profile_type', 'founder'),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return []
        const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
        return data ?? []
      }),
      supabase.from('profile_views').select('created_at').eq('username', profile.username).eq('profile_type', 'founder').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ])

    setViewCount(viewResult.count ?? 0)
    setNotifications(notifResult as Notification[])

    const reqs = reqResult.data ?? []
    if (reqs.length > 0) {
      const usernames = reqs.map((r: IntroRequest) => r.connector_username)
      const { data: connectors } = await supabase.from('connector_profiles').select('username, name, bio, expertise').in('username', usernames)
      const cMap: Record<string, { name: string; bio: string; expertise: string }> = {}
      connectors?.forEach((c: { username: string; name: string; bio: string; expertise: string }) => { cMap[c.username] = c })
      setRequests(reqs.map((r: IntroRequest) => ({ ...r, connector_name: cMap[r.connector_username]?.name, connector_bio: cMap[r.connector_username]?.bio, connector_expertise: cMap[r.connector_username]?.expertise })))
    } else {
      setRequests([])
    }

    // Build views chart (last 30 days)
    const viewDays: Record<string, number> = {}
    const views = viewsRaw.data ?? []
    views.forEach((v: { created_at: string }) => {
      const d = new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      viewDays[d] = (viewDays[d] ?? 0) + 1
    })
    const last30: ChartPoint[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      last30.push({ date: d, value: viewDays[d] ?? 0 })
    }
    setViewsChart(last30)

    // Build requests chart (by month)
    const rByMonth: Record<string, number> = {}
    reqs.forEach((r: IntroRequest) => {
      const m = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      rByMonth[m] = (rByMonth[m] ?? 0) + 1
    })
    setRequestsChart(Object.entries(rByMonth).slice(-6).map(([date, value]) => ({ date, value })))
  }, [profile.username])

  useEffect(() => {
    load()
    if (profile.github_repo) {
      fetchGithubData(profile.github_repo).then(({ commits, repoInfo }) => {
        setGithubCommits(commits)
        setGithubRepo(repoInfo)
      })
    }
  }, [load, profile.github_repo])

  const handleSignOut = async () => { await createClient().auth.signOut(); router.push('/') }
  const copyLink = () => { navigator.clipboard.writeText(profileUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const total = requests.length
  const accepted = requests.filter(r => r.status === 'accepted').length
  const pending = requests.filter(r => r.status === 'pending').length
  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0
  const needsList = profile.needs?.split(',').filter(Boolean).map(v => NEEDS_OPTIONS.find(o => o.value === v)?.label ?? v) ?? []
  const filteredRequests = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus)
  const acceptedRequests = requests.filter(r => r.status === 'accepted')

  return (
    <div className="min-h-screen bg-black text-white">
      <DashNav
        badge={profile.username}
        roleLabel="👔 Founder"
        notifications={notifications}
        onSignOut={handleSignOut}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-1">{profile.company_name}</h1>
            <p className="text-gray-400 text-sm">{profile.one_liner}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/builder" className="hidden sm:block px-4 py-2 text-sm border border-white/20 text-gray-300 rounded-xl hover:bg-white/5 transition-all">
              Edit Profile
            </Link>
            <Link href={`/f/${profile.username}`}
              className="px-4 py-2 text-sm bg-white text-black font-semibold rounded-xl hover:bg-emerald-400 transition-all">
              View Profile →
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Tab label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <Tab label="Intro Requests" active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} badge={pending} />
          <Tab label="My Network" active={activeTab === 'network'} onClick={() => setActiveTab('network')} badge={accepted} />
          <Tab label="Activity" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Profile Views" value={viewCount} sub="total" />
              <StatCard label="Requests Sent" value={total} sub="all time" color="blue" />
              <StatCard label="Acceptance Rate" value={`${acceptanceRate}%`} sub={`${accepted} accepted`} color="emerald" />
              <StatCard label="Active Network" value={accepted} sub="connections" color="yellow" />
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Views chart */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white">Profile Views</p>
                  <span className="text-xs text-gray-500">Last 30 days</span>
                </div>
                {viewsChart.some(p => p.value > 0) ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={viewsChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} interval={6} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#viewsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No views in the last 30 days</div>
                )}
              </div>

              {/* Requests chart */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white">Requests Sent</p>
                  <span className="text-xs text-gray-500">By month</span>
                </div>
                {requestsChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={requestsChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No requests sent yet</div>
                )}
              </div>
            </div>

            {/* Profile + GitHub row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Profile card */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Your Profile</p>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xl font-bold text-black flex-shrink-0">
                    {profile.company_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-lg truncate">{profile.company_name}</h2>
                    <p className="text-gray-400 text-sm line-clamp-2">{profile.one_liner}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex items-center gap-2"><span className="text-gray-500 w-14">Stage</span><span className="text-white">{profile.stage}</span></div>
                  {profile.mrr && <div className="flex items-center gap-2"><span className="text-gray-500 w-14">MRR</span><span className="text-emerald-400 font-medium">{profile.mrr}</span></div>}
                  {profile.users_count && <div className="flex items-center gap-2"><span className="text-gray-500 w-14">Users</span><span>{profile.users_count}</span></div>}
                  {profile.growth && <div className="flex items-center gap-2"><span className="text-gray-500 w-14">Growth</span><span className="text-emerald-400">{profile.growth}</span></div>}
                </div>
                {needsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {needsList.map(n => <span key={n} className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{n}</span>)}
                  </div>
                )}
                <div className="mt-auto space-y-2">
                  <button onClick={copyLink} className="w-full py-2.5 border border-white/20 text-white font-medium rounded-xl text-sm hover:bg-white/5 transition-all">
                    {copied ? '✓ Copied link!' : 'Copy Profile Link'}
                  </button>
                  <Link href="/connectors" className="block w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium rounded-xl text-center text-sm hover:bg-emerald-500/20 transition-all">
                    Browse Connectors →
                  </Link>
                </div>
              </div>

              {/* GitHub section */}
              {profile.github_repo ? (
                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" /></svg>
                      Build Progress
                    </p>
                    <a href={`https://github.com/${profile.github_repo}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
                      {profile.github_repo} ↗
                    </a>
                  </div>
                  {githubRepo && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                        <div className="text-xl font-bold text-white">{githubRepo.open_issues}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Open Issues</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                        <div className="text-xl font-bold text-yellow-400">{githubRepo.stars}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Stars</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                        <div className="text-xs font-bold text-emerald-400">{timeAgo(githubRepo.last_push)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Last Push</div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Recent Commits</p>
                  {githubCommits.length > 0 ? (
                    <div className="space-y-2 flex-1 overflow-hidden">
                      {githubCommits.slice(0, 5).map(c => (
                        <a key={c.sha} href={c.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all group">
                          <code className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">{c.sha}</code>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-300 group-hover:text-white transition-colors truncate">{c.message}</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">{c.author} · {timeAgo(c.date)}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">Loading commits...</p>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
                  <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" /></svg>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Connect your GitHub repo</p>
                    <p className="text-xs text-gray-600 mt-1">Show recent commits to impress connectors</p>
                  </div>
                  <Link href="/builder" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Add repo in profile →</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Requests Tab ── */}
        {activeTab === 'requests' && (
          <div className="space-y-5">
            {/* Filter bar */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'accepted', 'declined'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    filterStatus === s
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}>
                  {s} {s === 'all' ? `(${total})` : s === 'pending' ? `(${pending})` : s === 'accepted' ? `(${accepted})` : `(${requests.filter(r => r.status === 'declined').length})`}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-gray-400 mb-1">No requests {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'sent yet'}</p>
                <p className="text-sm text-gray-500 mb-5">Browse connectors who can help you get warm intros.</p>
                <Link href="/connectors" className="inline-block px-5 py-2.5 bg-emerald-500 text-black font-bold rounded-xl text-sm hover:bg-emerald-400 transition-all">Browse Connectors</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map(req => (
                  <div key={req.id} className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                          {(req.connector_name ?? req.connector_username).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm">{req.connector_name ?? req.connector_username}</span>
                            <StatusBadge status={req.status} />
                          </div>
                          {req.connector_expertise && (
                            <p className="text-xs text-gray-500 mb-2">{req.connector_expertise.split(',').slice(0, 3).join(' · ')}</p>
                          )}
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">"{req.message}"</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">{new Date(req.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <Link href={`/c/${req.connector_username}`} className="text-xs text-gray-500 hover:text-emerald-400 transition-colors flex-shrink-0 mt-1">
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Network Tab ── */}
        {activeTab === 'network' && (
          <div>
            {acceptedRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🌐</div>
                <p className="text-gray-400 mb-1">Your network is empty</p>
                <p className="text-sm text-gray-500 mb-5">Send intro requests to connectors to grow your network.</p>
                <Link href="/connectors" className="inline-block px-5 py-2.5 bg-emerald-500 text-black font-bold rounded-xl text-sm hover:bg-emerald-400 transition-all">Browse Connectors</Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {acceptedRequests.map(req => {
                  const expertiseTags = req.connector_expertise?.split(',').filter(Boolean).map(v => EXPERTISE_OPTIONS.find(o => o.value === v)?.label ?? v) ?? []
                  return (
                    <div key={req.id} className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                          {(req.connector_name ?? req.connector_username).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{req.connector_name ?? req.connector_username}</p>
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Connected</span>
                        </div>
                      </div>
                      {req.connector_bio && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{req.connector_bio}</p>}
                      {expertiseTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {expertiseTags.map(t => <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-400 border border-white/10">{t}</span>)}
                        </div>
                      )}
                      <Link href={`/c/${req.connector_username}`}
                        className="block w-full py-2 text-center text-xs font-semibold text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-all">
                        View Profile →
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Activity Tab ── */}
        {activeTab === 'activity' && (
          <div className="space-y-1">
            {requests.length === 0 && notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-400">No activity yet</p>
                <p className="text-sm text-gray-500 mt-1">Your activity feed will appear here as you use Warmchain.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
                <div className="space-y-0">
                  {[
                    ...requests.map(r => ({
                      id: r.id,
                      date: r.created_at,
                      type: r.status === 'pending' ? 'sent' : r.status,
                      title: r.status === 'pending'
                        ? `Sent request to ${r.connector_name ?? r.connector_username}`
                        : r.status === 'accepted'
                        ? `${r.connector_name ?? r.connector_username} accepted your request`
                        : `${r.connector_name ?? r.connector_username} declined your request`,
                      color: r.status === 'accepted' ? 'emerald' : r.status === 'declined' ? 'red' : 'yellow',
                    })),
                  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => (
                    <div key={event.id} className="flex items-start gap-5 pl-0 py-4 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 z-10 relative ${
                        event.color === 'emerald' ? 'bg-emerald-500/20 border border-emerald-500/40' :
                        event.color === 'red' ? 'bg-red-500/20 border border-red-500/40' :
                        'bg-yellow-500/20 border border-yellow-500/40'
                      }`}>
                        {event.color === 'emerald' ? '✓' : event.color === 'red' ? '✕' : '→'}
                      </div>
                      <div className="flex-1 min-w-0 pt-2">
                        <p className="text-sm text-white font-medium">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Connector Dashboard ────────────────────────────────────────────────────────

function ConnectorDashboard({ profile }: { profile: ConnectorProfile }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'stats'>('pending')
  const [requests, setRequests] = useState<(IntroRequest & { founder_company?: string; founder_one_liner?: string; founder_stage?: string; founder_user_id_val?: string })[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [viewCount, setViewCount] = useState(0)
  const [requestsChart, setRequestsChart] = useState<ChartPoint[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [reqResult, viewResult, notifResult] = await Promise.all([
      supabase.from('intro_requests').select('*').eq('connector_username', profile.username).order('created_at', { ascending: false }),
      supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('username', profile.username).eq('profile_type', 'connector'),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return []
        const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
        return data ?? []
      }),
    ])

    setViewCount(viewResult.count ?? 0)
    setNotifications(notifResult as Notification[])

    const reqs = reqResult.data ?? []
    if (reqs.length > 0) {
      const usernames = reqs.map((r: IntroRequest) => r.founder_username)
      const { data: founders } = await supabase.from('profiles').select('username, company_name, one_liner, stage, user_id').in('username', usernames)
      const fMap: Record<string, { company_name: string; one_liner: string; stage: string; user_id: string }> = {}
      founders?.forEach((f: { username: string; company_name: string; one_liner: string; stage: string; user_id: string }) => { fMap[f.username] = f })
      setRequests(reqs.map((r: IntroRequest) => ({ ...r, founder_company: fMap[r.founder_username]?.company_name, founder_one_liner: fMap[r.founder_username]?.one_liner, founder_stage: fMap[r.founder_username]?.stage, founder_user_id_val: fMap[r.founder_username]?.user_id })))

      // Build chart by month
      const byMonth: Record<string, number> = {}
      reqs.forEach((r: IntroRequest) => {
        const m = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        byMonth[m] = (byMonth[m] ?? 0) + 1
      })
      setRequestsChart(Object.entries(byMonth).slice(-6).map(([date, value]) => ({ date, value })))
    } else {
      setRequests([])
    }
    setLoading(false)
  }, [profile.username])

  useEffect(() => { load() }, [load])

  const handleSignOut = async () => { await createClient().auth.signOut(); router.push('/') }

  const updateStatus = async (req: typeof requests[0], status: 'accepted' | 'declined') => {
    setUpdating(req.id)
    try {
      const supabase = createClient()
      await supabase.from('intro_requests').update({ status }).eq('id', req.id)
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status } : r))
      if (req.founder_user_id_val) {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
          body: JSON.stringify({
            user_id: req.founder_user_id_val,
            type: status === 'accepted' ? 'request_accepted' : 'request_declined',
            title: status === 'accepted' ? `${profile.name} accepted your intro request!` : `${profile.name} declined your intro request`,
            body: status === 'accepted'
              ? `${profile.name} is ready to help. Connect with them at warmchain.com/c/${profile.username}`
              : `${profile.name} couldn't help this time. Keep reaching out to other connectors.`,
            request_id: req.id,
          }),
        })
      }
    } finally {
      setUpdating(null)
    }
  }

  const pending = requests.filter(r => r.status === 'pending')
  const handled = requests.filter(r => r.status !== 'pending')
  const total = requests.length
  const accepted = requests.filter(r => r.status === 'accepted').length
  const responded = requests.filter(r => r.status !== 'pending').length
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0
  const helpsTags = profile.helps_with?.split(',').filter(Boolean).map(v => HELPS_WITH_OPTIONS.find(o => o.value === v)?.label ?? v) ?? []

  return (
    <div className="min-h-screen bg-black text-white">
      <DashNav
        badge={profile.username}
        roleLabel="🤝 Connector"
        notifications={notifications}
        onSignOut={handleSignOut}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-1">{profile.name}</h1>
            <p className="text-gray-400 text-sm">{profile.bio?.slice(0, 80)}{profile.bio?.length > 80 ? '…' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/connector-builder" className="hidden sm:block px-4 py-2 text-sm border border-white/20 text-gray-300 rounded-xl hover:bg-white/5 transition-all">Edit Profile</Link>
            <Link href={`/c/${profile.username}`} className="px-4 py-2 text-sm bg-white text-black font-semibold rounded-xl hover:bg-emerald-400 transition-all">View Profile →</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard label="Requests Received" value={total} sub="all time" />
          <StatCard label="Intros Made" value={accepted} sub={`${responded} responded`} color="emerald" />
          <StatCard label="Response Rate" value={`${responseRate}%`} sub={pending.length > 0 ? `${pending.length} pending` : 'all handled'} color={responseRate >= 80 ? 'emerald' : responseRate >= 50 ? 'yellow' : 'rose'} />
          <StatCard label="Profile Views" value={viewCount} sub="total" color="blue" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Tab label="Pending" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} badge={pending.length} />
          <Tab label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <Tab label="Analytics" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
        </div>

        {/* ── Pending Tab ── */}
        {activeTab === 'pending' && (
          loading ? (
            <div className="flex justify-center py-16"><div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : pending.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-400">No pending requests</p>
              <p className="text-xs text-gray-500 mt-1">Founders will send structured intro requests here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(req => (
                <div key={req.id} className="p-5 rounded-2xl border border-yellow-500/15 bg-yellow-500/[0.03] hover:border-yellow-500/25 transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                      {(req.founder_company ?? req.founder_username).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold">{req.founder_company ?? req.founder_username}</span>
                        {req.founder_stage && <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10">{req.founder_stage}</span>}
                      </div>
                      {req.founder_one_liner && <p className="text-sm text-gray-400 line-clamp-1">{req.founder_one_liner}</p>}
                    </div>
                    <Link href={`/f/${req.founder_username}`} target="_blank" className="text-xs text-gray-500 hover:text-emerald-400 transition-colors flex-shrink-0">
                      Profile →
                    </Link>
                  </div>
                  <div className="mb-4 p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <p className="text-sm text-gray-300 leading-relaxed">"{req.message}"</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <button onClick={() => updateStatus(req, 'accepted')} disabled={updating === req.id}
                      className="flex-1 py-2.5 bg-emerald-500 text-black font-bold rounded-xl text-sm hover:bg-emerald-400 transition-all disabled:opacity-50">
                      {updating === req.id ? '…' : '✓ Accept'}
                    </button>
                    <button onClick={() => updateStatus(req, 'declined')} disabled={updating === req.id}
                      className="flex-1 py-2.5 border border-white/20 text-gray-300 rounded-xl text-sm hover:bg-white/5 transition-all disabled:opacity-50">
                      {updating === req.id ? '…' : '✕ Decline'}
                    </button>
                    <p className="text-xs text-gray-600 flex-shrink-0">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          handled.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-400">No history yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {handled.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                      {(req.founder_company ?? req.founder_username).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{req.founder_company ?? req.founder_username}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{req.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <span className="text-xs text-gray-600">{new Date(req.created_at).toLocaleDateString()}</span>
                    <StatusBadge status={req.status} />
                    <Link href={`/f/${req.founder_username}`} className="text-xs text-gray-600 hover:text-emerald-400 transition-colors">→</Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white">Requests Over Time</p>
                  <span className="text-xs text-gray-500">By month</span>
                </div>
                {requestsChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={requestsChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No requests yet</div>
                )}
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-sm font-semibold text-white mb-4">Response Breakdown</p>
                <div className="space-y-3">
                  {[
                    { label: 'Accepted', count: accepted, total, color: 'bg-emerald-500' },
                    { label: 'Declined', count: requests.filter(r => r.status === 'declined').length, total, color: 'bg-red-500' },
                    { label: 'Pending', count: pending.length, total, color: 'bg-yellow-500' },
                  ].map(({ label, count, total: t, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-white font-medium">{count} ({t > 0 ? Math.round((count / t) * 100) : 0}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${t > 0 ? (count / t) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Expertise</p>
                  <div className="flex flex-wrap gap-1.5">
                    {helpsTags.map(t => <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile link */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Your public profile</p>
                <p className="text-xs text-gray-500 mt-0.5">warmchain.com/c/{profile.username}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/c/${profile.username}`} className="px-4 py-2 text-sm bg-white text-black font-semibold rounded-xl hover:bg-emerald-400 transition-all">View →</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

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
      else router.push(user.user_metadata?.user_type === 'connector' ? '/connector-builder' : '/builder')
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
