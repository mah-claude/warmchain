'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type NotionPage = { id: string; title: string; lastEdited: string }

type NotionConnection = {
  workspace_name: string | null
  workspace_icon: string | null
  selected_page_id: string | null
  selected_page_title: string | null
  last_synced_at: string | null
  sync_error: string | null
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function IntegrationsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [token, setToken] = useState<string | null>(null)
  const [conn, setConn] = useState<NotionConnection | null>(null)
  const [pages, setPages] = useState<NotionPage[]>([])
  const [loadingConn, setLoadingConn] = useState(true)
  const [loadingPages, setLoadingPages] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [syncResult, setSyncResult] = useState<{ page_title: string; word_count: number; synced_at: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)
  const [notionEnabled, setNotionEnabled] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  // Auth + initial load
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?next=/settings/integrations'); return }
      setToken(session.access_token)

      // Handle OAuth callback params
      const connected = searchParams.get('connected')
      const err = searchParams.get('error')
      if (connected === '1') setSuccessBanner('Notion connected successfully!')
      if (err) setError(`Connection failed: ${err.replace(/_/g, ' ')}`)

      // Load connection
      const res = await fetch('/api/notion/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.connected) {
          setConn(data.connection)
          setSelectedPageId(data.connection.selected_page_id ?? '')
          setNotionEnabled(data.notion_enabled ?? false)
        }
      }
      setLoadingConn(false)
    }
    init()
  }, [router, searchParams])

  const loadPages = useCallback(async () => {
    if (!token) return
    setLoadingPages(true)
    setError(null)
    try {
      const res = await fetch('/api/notion/pages', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load pages')
      setPages(data.pages ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pages')
    } finally {
      setLoadingPages(false)
    }
  }, [token])

  // Auto-load pages when connected
  useEffect(() => {
    if (conn && token) loadPages()
  }, [conn, token, loadPages])

  const handleSync = async () => {
    if (!token || !selectedPageId) return
    setSyncing(true)
    setError(null)
    setSyncResult(null)
    setRetryAfter(null)
    try {
      const res = await fetch('/api/notion/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: selectedPageId }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setRetryAfter(data.retry_after ?? 30)
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      setSyncResult({ page_title: data.page_title, word_count: data.word_count, synced_at: data.synced_at })
      // Update local state
      setConn(prev => prev ? { ...prev, last_synced_at: data.synced_at, sync_error: null, selected_page_id: selectedPageId, selected_page_title: data.page_title } : prev)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handlePageSelect = async (pageId: string) => {
    setSelectedPageId(pageId)
    if (!token || pageId === conn?.selected_page_id) return
    const page = pages.find(p => p.id === pageId)
    await fetch('/api/notion/sync', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: pageId, page_title: page?.title ?? '' }),
    })
    setConn(prev => prev ? { ...prev, selected_page_id: pageId, selected_page_title: page?.title ?? null } : prev)
  }

  const handleToggleVisibility = async () => {
    if (!token) return
    setTogglingVisibility(true)
    const newVal = !notionEnabled
    try {
      const supabase = createClient()
      await supabase.from('profiles').update({ notion_enabled: newVal }).eq('user_id', (await supabase.auth.getUser()).data.user!.id)
      setNotionEnabled(newVal)
      setSuccessBanner(newVal ? 'Snapshot now visible on your public profile.' : 'Snapshot hidden from your public profile.')
    } catch {
      setError('Failed to update visibility')
    } finally {
      setTogglingVisibility(false)
    }
  }

  const handleDisconnect = async () => {
    if (!token || !confirm('Disconnect Notion? Your synced content will be hidden from your profile.')) return
    setDisconnecting(true)
    try {
      await fetch('/api/notion/disconnect', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setConn(null)
      setPages([])
      setSelectedPageId('')
      setSyncResult(null)
      setSuccessBanner('Notion disconnected.')
    } catch {
      setError('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleConnect = () => {
    if (!token) return
    window.location.href = `/api/notion/connect`
  }

  if (loadingConn) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors">Warmchain</Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">← Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Integrations</h1>
          <p className="text-gray-400">Connect tools so investors can review everything inside Warmchain — no external links.</p>
        </div>

        {/* Success / error banners */}
        {successBanner && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
            <span>{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)} className="text-emerald-500 hover:text-white ml-3">✕</button>
          </div>
        )}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white ml-3">✕</button>
          </div>
        )}

        {/* ── Notion integration card ── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Notion logo (N) */}
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.469l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466L4.459 4.208zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933l3.222-.187z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Notion</div>
                <div className="text-xs text-gray-500">Sync your investor update page</div>
              </div>
            </div>
            {conn ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="text-xs text-gray-500">Not connected</span>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {!conn ? (
              /* ── Not connected state ── */
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-2 leading-relaxed">
                  Connect your Notion workspace so investors can read your deck, update, or memo — all inside Warmchain.
                </p>
                <ul className="text-xs text-gray-500 mb-6 space-y-1">
                  <li>✓ One-click OAuth — no API keys needed</li>
                  <li>✓ You choose which page to share</li>
                  <li>✓ On-demand sync, version history kept</li>
                  <li>✓ Your Notion token is never exposed to visitors</li>
                </ul>
                <button
                  onClick={handleConnect}
                  className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 hover:text-white transition-all text-sm"
                >
                  Connect Notion
                </button>
              </div>
            ) : (
              /* ── Connected state ── */
              <div className="space-y-5">
                {/* Workspace info */}
                {conn.workspace_name && (
                  <div className="flex items-center gap-2 text-sm">
                    {conn.workspace_icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={conn.workspace_icon} alt="" className="w-5 h-5 rounded" />
                    )}
                    <span className="text-gray-300">Workspace:</span>
                    <span className="text-white font-medium">{conn.workspace_name}</span>
                  </div>
                )}

                {/* Page selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Page to share on your profile
                  </label>
                  {loadingPages ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                      Loading pages…
                    </div>
                  ) : pages.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No pages found.{' '}
                      <button onClick={loadPages} className="text-emerald-400 hover:text-emerald-300 underline">Refresh</button>
                    </div>
                  ) : (
                    <select
                      value={selectedPageId}
                      onChange={e => handlePageSelect(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none"
                    >
                      <option value="" disabled className="bg-zinc-900">Select a page…</option>
                      {pages.map(p => (
                        <option key={p.id} value={p.id} className="bg-zinc-900">
                          {p.title || 'Untitled'} — edited {timeAgo(p.lastEdited)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Last sync info */}
                {conn.last_synced_at && (
                  <div className="text-xs text-gray-500">
                    Last synced {timeAgo(conn.last_synced_at)}
                    {conn.selected_page_title && <> · <span className="text-gray-400">{conn.selected_page_title}</span></>}
                  </div>
                )}

                {/* Sync error */}
                {conn.sync_error && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    Last sync failed: {conn.sync_error}
                  </div>
                )}

                {/* Rate limit message */}
                {retryAfter !== null && (
                  <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    Rate limited. Retry in {retryAfter}s.
                  </div>
                )}

                {/* Sync result */}
                {syncResult && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Synced &ldquo;{syncResult.page_title}&rdquo; — {syncResult.word_count} words
                  </div>
                )}

                {/* Public visibility toggle */}
                {conn.last_synced_at && (
                  <div className="flex items-center justify-between py-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Show on public profile</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {notionEnabled ? 'Snapshot is visible to anyone viewing your profile.' : 'Snapshot is hidden — only you can see it.'}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleVisibility}
                      disabled={togglingVisibility}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${notionEnabled ? 'bg-emerald-500' : 'bg-white/15'}`}
                      role="switch"
                      aria-checked={notionEnabled}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notionEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleSync}
                    disabled={syncing || !selectedPageId}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {syncing ? (
                      <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Syncing…</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Sync Now</>
                    )}
                  </button>
                  <button
                    onClick={loadPages}
                    disabled={loadingPages}
                    className="px-4 py-2.5 border border-white/15 text-gray-400 hover:text-white hover:border-white/30 rounded-xl transition-all text-sm"
                  >
                    Refresh pages
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="ml-auto text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── GitHub (coming soon) ── */}
        <div className="mt-4 rounded-2xl border border-white/5 bg-white/2 px-6 py-5 flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-white">GitHub</div>
              <div className="text-xs text-gray-500">Product momentum — commits, activity, releases</div>
            </div>
          </div>
          <span className="text-xs text-gray-600 border border-white/10 px-2.5 py-1 rounded-full">Coming soon</span>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors">← Back to Dashboard</Link>
        </div>
      </main>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <IntegrationsInner />
    </Suspense>
  )
}
