'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type IntegrationId =
  | 'yc_batch' | 'linkedin_url' | 'github_repo'
  | 'notion_url' | 'pitch_url' | 'docsend_url'
  | 'linear_url' | 'producthunt_url'

const INTEGRATIONS = [
  { id: 'yc_batch' as IntegrationId,       name: 'Y Combinator', placeholder: 'W24',                                hint: 'Format: W24, S23 …' },
  { id: 'linkedin_url' as IntegrationId,   name: 'LinkedIn',     placeholder: 'https://linkedin.com/in/…',        hint: '' },
  { id: 'github_repo' as IntegrationId,    name: 'GitHub',       placeholder: 'owner/repo-name',                  hint: 'Shows recent commits on your profile' },
  { id: 'notion_url' as IntegrationId,     name: 'Notion',       placeholder: 'https://notion.so/…',             hint: 'Share → Share to web → copy link' },
  { id: 'pitch_url' as IntegrationId,      name: 'Pitch',        placeholder: 'https://pitch.com/public/…',      hint: 'Share → Public link → copy' },
  { id: 'docsend_url' as IntegrationId,    name: 'Docsend',      placeholder: 'https://docsend.com/view/…',      hint: '' },
  { id: 'linear_url' as IntegrationId,     name: 'Linear',       placeholder: 'https://linear.app/…/roadmap/…', hint: 'Public roadmap URL' },
  { id: 'producthunt_url' as IntegrationId,name: 'Product Hunt', placeholder: 'https://producthunt.com/products/…', hint: '' },
]

function BuilderIntegrationsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const username = searchParams.get('username') ?? ''

  const [values, setValues] = useState<Record<IntegrationId, string>>({
    yc_batch: '', linkedin_url: '', github_repo: '',
    notion_url: '', pitch_url: '', docsend_url: '',
    linear_url: '', producthunt_url: '',
  })
  const [saving, setSaving] = useState<IntegrationId | null>(null)
  const [saved, setSaved] = useState<Set<IntegrationId>>(new Set())
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setCheckingAuth(false)
    }
    check()
  }, [router])

  const handleSave = async (id: IntegrationId) => {
    const value = values[id].trim()
    if (!value || !userId) return
    setSaving(id)
    const supabase = createClient()
    await supabase.from('profiles').update({ [id]: value }).eq('user_id', userId)
    setSaved(prev => new Set([...prev, id]))
    setSaving(null)
  }

  if (checkingAuth) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-8 pt-8 pb-4">
        <span className="text-lg font-bold tracking-tight">warmchain</span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-emerald-600" />)}
          <div className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
        </div>
        <span className="text-sm text-gray-500">Almost done</span>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 py-10">
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
            {username && (
              <Link href={`/f/${username}`} className="text-emerald-400 text-sm font-mono hover:text-emerald-300 transition-colors">
                warmchain.co/f/{username}
              </Link>
            )}
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Connect your tools <span className="text-gray-700 font-normal normal-case">— all optional</span>
          </p>

          <div className="space-y-2.5">
            {INTEGRATIONS.map(({ id, name, placeholder, hint }) => {
              const isSaved = saved.has(id)
              const isSaving = saving === id
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    isSaved ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="w-24 flex-shrink-0">
                    <p className="text-sm font-medium text-white leading-tight">{name}</p>
                    {isSaved && <p className="text-xs text-emerald-400 mt-0.5">Connected</p>}
                  </div>
                  <input
                    type="text"
                    value={values[id]}
                    onChange={e => setValues(prev => ({ ...prev, [id]: e.target.value }))}
                    placeholder={placeholder}
                    disabled={isSaved}
                    onKeyDown={e => e.key === 'Enter' && handleSave(id)}
                    className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-700 focus:outline-none focus:border-white/25 transition-all font-mono disabled:opacity-40"
                  />
                  {!isSaved && (
                    <button
                      onClick={() => handleSave(id)}
                      disabled={!values[id].trim() || isSaving}
                      className="px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-xs font-medium text-white transition-all disabled:opacity-30 flex-shrink-0"
                    >
                      {isSaving ? '…' : 'Save'}
                    </button>
                  )}
                  {hint && !isSaved && !values[id] && (
                    <p className="sr-only">{hint}</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/dashboard"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-base text-center transition-all duration-200"
            >
              Go to dashboard
            </Link>
            {username && (
              <Link href={`/f/${username}`} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                View my profile
              </Link>
            )}
            <p className="text-xs text-gray-600">You can always add these later from Settings → Integrations</p>
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
      <BuilderIntegrationsInner />
    </Suspense>
  )
}
