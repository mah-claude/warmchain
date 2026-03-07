'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function IntegrationsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const username = searchParams.get('username') ?? ''
  const errorParam = searchParams.get('error')

  const [githubRepo, setGithubRepo] = useState('')
  const [savingGithub, setSavingGithub] = useState(false)
  const [githubSaved, setGithubSaved] = useState(false)
  const [githubError, setGithubError] = useState('')
  const [notionError, setNotionError] = useState<string | null>(
    errorParam === 'notion_not_configured' ? 'Notion integration is not enabled yet.' : null
  )
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCheckingAuth(false)
    }
    check()
  }, [router])

  const handleGithubSave = async () => {
    const repo = githubRepo.trim()
    if (!repo) { setGithubError('Enter a repo like owner/repo-name'); return }
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { setGithubError('Format: owner/repo-name'); return }
    setGithubError('')
    setSavingGithub(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('profiles').update({ github_repo: repo }).eq('user_id', user.id)
      if (error) throw error
      setGithubSaved(true)
    } catch {
      setGithubError('Failed to save. Try again.')
    } finally {
      setSavingGithub(false)
    }
  }

  const handleConnectNotion = () => {
    setNotionError(null)
    window.location.href = `/api/notion/connect`
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 pt-8 pb-4">
        <span className="text-lg font-bold tracking-tight">warmchain</span>
        <div className="flex items-center gap-2">
          {/* All 3 dots filled = creation done */}
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-emerald-600" />
          ))}
          <div className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
        </div>
        <span className="text-sm text-gray-500">Almost done</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Success header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">You&apos;re live!</h1>
            <p className="text-gray-400 text-sm mb-1">Your profile is ready.</p>
            <Link
              href={`/f/${username}`}
              className="text-emerald-400 text-sm font-mono hover:text-emerald-300 transition-colors"
            >
              warmchain.co/f/{username}
            </Link>
          </div>

          {/* Integrations */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Connect your tools</p>

          <div className="space-y-3">

            {/* GitHub */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-start gap-4">
                {/* GitHub icon */}
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">GitHub</p>
                    {githubSaved && (
                      <span className="text-xs text-emerald-400 font-medium">Connected</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Show recent commits on your investor profile.</p>
                  {!githubSaved ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={e => setGithubRepo(e.target.value)}
                        placeholder="owner/repo-name"
                        className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 font-mono"
                        maxLength={100}
                        onKeyDown={e => e.key === 'Enter' && handleGithubSave()}
                      />
                      <button
                        onClick={handleGithubSave}
                        disabled={savingGithub}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                      >
                        {savingGithub ? '…' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-gray-400">{githubRepo}</p>
                  )}
                  {githubError && <p className="text-xs text-red-400 mt-1.5">{githubError}</p>}
                </div>
              </div>
            </div>

            {/* Notion */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-start gap-4">
                {/* Notion icon */}
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1">Notion</p>
                  <p className="text-xs text-gray-500 mb-3">Sync a Notion page to display as your pitch deck on your profile.</p>
                  {notionError ? (
                    <p className="text-xs text-amber-400">{notionError}</p>
                  ) : (
                    <button
                      onClick={handleConnectNotion}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
                    >
                      Connect workspace
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/dashboard"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-base text-center transition-all duration-200 active:scale-[0.99]"
            >
              Go to dashboard
            </Link>
            <Link href={`/f/${username}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              View my profile
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function BuilderIntegrations() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <IntegrationsInner />
    </Suspense>
  )
}
