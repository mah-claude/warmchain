'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

// ── Integration definitions ────────────────────────────────────────────────
type IntegrationId =
  | 'yc_batch' | 'linkedin_url' | 'github_repo'
  | 'notion_url' | 'pitch_url' | 'docsend_url'
  | 'linear_url' | 'producthunt_url'

interface Integration {
  id: IntegrationId
  name: string
  description: string
  placeholder: string
  hint?: string
  validate?: (v: string) => string | null   // returns error string or null
  icon: React.ReactNode
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'yc_batch',
    name: 'Y Combinator',
    description: 'Show your YC batch badge on your profile.',
    placeholder: 'W24',
    hint: 'Format: W24, S23, W22 …',
    validate: v => /^[WS]\d{2}$/.test(v.trim()) ? null : 'Format: W24 or S23',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.93 1L7.737 8.901 0 8.464l4.194 7.901L0 24.265 7.737 23.83 11.93 31.73l4.193-7.901 7.738.437-4.194-7.9 4.194-7.901-7.738.437z" transform="scale(0.75) translate(1,0)"/>
      </svg>
    ),
  },
  {
    id: 'linkedin_url',
    name: 'LinkedIn',
    description: 'Link your LinkedIn profile for credibility.',
    placeholder: 'https://linkedin.com/in/yourname',
    validate: v =>
      v.includes('linkedin.com/in/') ? null : 'Must be a linkedin.com/in/ URL',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    id: 'notion_url',
    name: 'Notion',
    description: 'Share a public Notion page as your investor deck.',
    placeholder: 'https://notion.so/Your-Page-abc123',
    hint: 'In Notion: Share → Share to web → copy link',
    validate: v =>
      v.startsWith('https://') && v.includes('notion') ? null : 'Must be a Notion page URL',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.469l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933z"/>
      </svg>
    ),
  },
  {
    id: 'pitch_url',
    name: 'Pitch',
    description: 'Embed your Pitch deck directly on your profile.',
    placeholder: 'https://pitch.com/public/…',
    hint: 'In Pitch: Share → Public link → copy',
    validate: v =>
      v.startsWith('https://pitch.com/') ? null : 'Must be a pitch.com URL',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 12.75l-8 5a.75.75 0 01-1.25-.578V6.828a.75.75 0 011.25-.578l8 5a.75.75 0 010 1.5z"/>
      </svg>
    ),
  },
  {
    id: 'docsend_url',
    name: 'Docsend',
    description: 'Link your fundraising deck from Docsend.',
    placeholder: 'https://docsend.com/view/…',
    validate: v =>
      v.startsWith('https://docsend.com/') ? null : 'Must be a docsend.com URL',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
      </svg>
    ),
  },
  {
    id: 'linear_url',
    name: 'Linear',
    description: 'Show your public product roadmap.',
    placeholder: 'https://linear.app/yourteam/roadmap/…',
    validate: v =>
      v.startsWith('https://linear.app/') ? null : 'Must be a linear.app URL',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3.526 10.028L13.97 20.472l-.338.326A10.5 10.5 0 013.526 10.028zm-.5-1.044a10.5 10.5 0 0012.432 12.432L3.026 8.984zm1.327-2.47l13.13 13.13a10.5 10.5 0 00-13.13-13.13zm1.413-1.061A10.5 10.5 0 0120.05 20.233L5.766 5.453zm2.062-1.113L20.49 18.51A10.5 10.5 0 007.828 4.34zm2.46-1.065L20.875 14.85a10.5 10.5 0 00-10.587-11.575zm3.12-.607l8.672 8.672A10.5 10.5 0 0013.408 3.668zm3.902-.08a10.5 10.5 0 014.97 4.956L17.31 3.588z"/>
      </svg>
    ),
  },
  {
    id: 'github_repo',
    name: 'GitHub',
    description: 'Show recent commits from your public repo.',
    placeholder: 'owner/repo-name',
    hint: 'Format: owner/repo — must be a public repo',
    validate: v =>
      /^[\w.-]+\/[\w.-]+$/.test(v.trim()) ? null : 'Format: owner/repo-name',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
  },
  {
    id: 'producthunt_url',
    name: 'Product Hunt',
    description: 'Link your Product Hunt launch page.',
    placeholder: 'https://producthunt.com/products/…',
    validate: v =>
      v.includes('producthunt.com/') ? null : 'Must be a producthunt.com URL',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 000-3.6M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m1.604 14.4H10.2v3.6H7.8V6h5.804a4.2 4.2 0 010 8.4"/>
      </svg>
    ),
  },
]

// ── Single integration card ────────────────────────────────────────────────
function IntegrationCard({
  integration,
  currentValue,
  onSave,
}: {
  integration: Integration
  currentValue: string
  onSave: (id: IntegrationId, value: string) => Promise<void>
}) {
  const [value, setValue] = useState(currentValue)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(!!currentValue)

  const isConnected = !!currentValue
  const isDirty = value !== currentValue

  const handleSave = async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      // Empty → disconnect (clear)
      setSaving(true)
      await onSave(integration.id, '')
      setSaved(false)
      setSaving(false)
      return
    }
    if (integration.validate) {
      const err = integration.validate(trimmed)
      if (err) { setError(err); return }
    }
    setError('')
    setSaving(true)
    await onSave(integration.id, trimmed)
    setSaved(true)
    setSaving(false)
  }

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-200 ${
      isConnected && !isDirty
        ? 'border-emerald-500/25 bg-emerald-500/5'
        : 'border-white/10 bg-white/[0.02]'
    }`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isConnected && !isDirty ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-gray-400'
        }`}>
          {integration.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-white">{integration.name}</p>
            {isConnected && !isDirty && (
              <span className="text-xs text-emerald-400 font-medium">Connected</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3">{integration.description}</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setError(''); setSaved(false) }}
              placeholder={integration.placeholder}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="flex-1 min-w-0 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 transition-all font-mono"
            />
            {isDirty || !saved ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50 flex-shrink-0"
              >
                {saving ? '…' : 'Save'}
              </button>
            ) : null}
            {isConnected && !isDirty && (
              <button
                onClick={() => { setValue(''); setSaved(false) }}
                className="px-3.5 py-2.5 border border-white/10 text-gray-500 hover:text-white hover:border-white/20 text-sm rounded-xl transition-all flex-shrink-0"
              >
                Remove
              </button>
            )}
          </div>

          {integration.hint && !isConnected && (
            <p className="text-xs text-gray-600 mt-1.5">{integration.hint}</p>
          )}
          {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
function IntegrationsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [values, setValues] = useState<Record<IntegrationId, string>>({
    yc_batch: '', linkedin_url: '', github_repo: '',
    notion_url: '', pitch_url: '', docsend_url: '',
    linear_url: '', producthunt_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const err = searchParams.get('error')
      if (err) setBanner(`Note: ${err.replace(/_/g, ' ')}`)

      const { data } = await supabase
        .from('profiles')
        .select('yc_batch,linkedin_url,github_repo,notion_url,pitch_url,docsend_url,linear_url,producthunt_url')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setValues({
          yc_batch: data.yc_batch ?? '',
          linkedin_url: data.linkedin_url ?? '',
          github_repo: data.github_repo ?? '',
          notion_url: data.notion_url ?? '',
          pitch_url: data.pitch_url ?? '',
          docsend_url: data.docsend_url ?? '',
          linear_url: data.linear_url ?? '',
          producthunt_url: data.producthunt_url ?? '',
        })
      }
      setLoading(false)
    }
    init()
  }, [router, searchParams])

  const handleSave = async (id: IntegrationId, value: string) => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('profiles').update({ [id]: value || null }).eq('user_id', userId)
    setValues(prev => ({ ...prev, [id]: value }))
    setBanner(value ? `${INTEGRATIONS.find(i => i.id === id)?.name} connected!` : 'Removed.')
    setTimeout(() => setBanner(null), 3000)
  }

  const connectedCount = Object.values(values).filter(Boolean).length

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/8 bg-black/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="text-sm font-semibold">Integrations</span>
          </div>
          <span className="text-xs text-gray-500">
            {connectedCount} connected
          </span>
        </div>
      </nav>

      {/* Banner */}
      {banner && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20">
          <div className="max-w-2xl mx-auto px-6 py-3">
            <p className="text-sm text-emerald-300">{banner}</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-3">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Connect your tools</h1>
          <p className="text-gray-500 text-sm">
            Paste a public URL — no OAuth, no permissions, no setup.
            Everything shows up on your investor profile automatically.
          </p>
        </div>

        {INTEGRATIONS.map(integration => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            currentValue={values[integration.id]}
            onSave={handleSave}
          />
        ))}

        <div className="pt-4 pb-10 text-center">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
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
