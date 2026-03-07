'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { STAGES, NEEDS_OPTIONS } from '@/lib/types'

export default function EditProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [focused, setFocused] = useState('')

  const [form, setForm] = useState({
    username: '',
    company_name: '',
    one_liner: '',
    stage: '',
    traction: '',
    mrr: '',
    users_count: '',
    growth: '',
    needs: [] as string[],
    ask: '',
    team: '',
    links: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (!data) { router.push('/builder'); return }
      setForm({
        username: data.username ?? '',
        company_name: data.company_name ?? '',
        one_liner: data.one_liner ?? '',
        stage: data.stage ?? '',
        traction: data.traction ?? '',
        mrr: data.mrr ?? '',
        users_count: data.users_count ?? '',
        growth: data.growth ?? '',
        needs: data.needs ? data.needs.split(',').filter(Boolean) : [],
        ask: data.ask ?? '',
        team: data.team ?? '',
        links: data.links ?? '',
      })
      setLoading(false)
    }
    load()
  }, [router])

  const set = (field: string, value: string) => {
    setSaved(false)
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleNeed = (value: string) => {
    setSaved(false)
    setForm(prev => ({
      ...prev,
      needs: prev.needs.includes(value)
        ? prev.needs.filter(n => n !== value)
        : [...prev.needs, value],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.stage) { setError('Please select a stage'); return }
    if (form.needs.length === 0) { setError('Select at least one need'); return }
    if (!form.ask) { setError('Describe your ask'); return }
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: err } = await supabase.from('profiles').update({
        company_name: form.company_name,
        one_liner: form.one_liner,
        stage: form.stage,
        traction: form.traction,
        mrr: form.mrr || null,
        users_count: form.users_count || null,
        growth: form.growth || null,
        needs: form.needs.join(','),
        ask: form.ask,
        team: form.team || null,
        links: form.links || null,
      }).eq('user_id', user.id)
      if (err) throw err
      setSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inp = (active: boolean) =>
    `w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-150 text-sm ${
      active ? 'border-emerald-500/60 shadow-[0_0_12px_rgba(52,211,153,0.1)]' : 'border-white/10 hover:border-white/20'
    }`

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
            <span className="text-sm font-semibold text-white">Edit profile</span>
          </div>
          <Link
            href={`/f/${form.username}`}
            className="text-xs text-gray-500 hover:text-emerald-400 transition-colors font-mono"
            target="_blank"
          >
            /f/{form.username} ↗
          </Link>
        </div>
      </nav>

      {/* Saved banner */}
      {saved && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20">
          <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-emerald-300">Profile saved.</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* ── Identity ── */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">Identity</h2>
            <div className="space-y-4">
              {/* Username (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Your URL</label>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl">
                  <span className="text-gray-500 text-sm font-mono">warmchain.co/f/</span>
                  <span className="text-gray-300 text-sm font-mono">{form.username}</span>
                  <span className="ml-auto text-xs text-gray-600">can&apos;t change</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Company name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={e => set('company_name', e.target.value)}
                  onFocus={() => setFocused('company_name')} onBlur={() => setFocused('')}
                  required className={inp(focused === 'company_name')} maxLength={60}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  One-liner <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.one_liner}
                  onChange={e => set('one_liner', e.target.value)}
                  onFocus={() => setFocused('one_liner')} onBlur={() => setFocused('')}
                  required placeholder="B2B SaaS that automates X for Y"
                  className={inp(focused === 'one_liner')} maxLength={120}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-white/8" />

          {/* ── Stage & Metrics ── */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">Stage & metrics</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stage <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {STAGES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSaved(false); setForm(prev => ({ ...prev, stage: s })) }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-150 ${
                        form.stage === s
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Traction <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  value={form.traction}
                  onChange={e => set('traction', e.target.value)}
                  onFocus={() => setFocused('traction')} onBlur={() => setFocused('')}
                  required rows={3} placeholder="50 beta users, $10k MRR, growing 20% MoM"
                  className={`${inp(focused === 'traction')} resize-none`} maxLength={300}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'mrr', label: 'MRR', ph: '$12k' },
                  { key: 'users_count', label: 'Users', ph: '250' },
                  { key: 'growth', label: 'Growth', ph: '20% MoM' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form] as string}
                      onChange={e => set(key, e.target.value)}
                      onFocus={() => setFocused(key)} onBlur={() => setFocused('')}
                      placeholder={ph}
                      className={inp(focused === key)} maxLength={30}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="border-t border-white/8" />

          {/* ── The Ask ── */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-5">The ask</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What do you need? <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {NEEDS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleNeed(opt.value)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
                        form.needs.includes(opt.value)
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Describe your ask <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  value={form.ask}
                  onChange={e => set('ask', e.target.value)}
                  onFocus={() => setFocused('ask')} onBlur={() => setFocused('')}
                  required rows={4}
                  placeholder="Raising $1.5M pre-seed. Looking for angels who invest in B2B SaaS."
                  className={`${inp(focused === 'ask')} resize-none`} maxLength={400}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Team</label>
                <textarea
                  value={form.team}
                  onChange={e => set('team', e.target.value)}
                  onFocus={() => setFocused('team')} onBlur={() => setFocused('')}
                  rows={2} placeholder="2 founders — ex-Stripe engineer, ex-BCG consultant"
                  className={`${inp(focused === 'team')} resize-none`} maxLength={300}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Links</label>
                <input
                  type="text"
                  value={form.links}
                  onChange={e => set('links', e.target.value)}
                  onFocus={() => setFocused('links')} onBlur={() => setFocused('')}
                  placeholder="https://yoursite.com, https://twitter.com/you"
                  className={inp(focused === 'links')} maxLength={300}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-white/8" />

          {/* ── Integrations ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Integrations</h2>
              <Link href="/settings/integrations" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Manage all →
              </Link>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div>
                <p className="text-sm font-medium text-gray-300">GitHub, Notion, LinkedIn, YC, Pitch &amp; more</p>
                <p className="text-xs text-gray-600 mt-0.5">Connect tools to enrich your investor profile — all URL-based, no OAuth</p>
              </div>
              <Link
                href="/settings/integrations"
                className="px-3 py-1.5 text-xs text-white border border-white/15 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0 ml-3"
              >
                Open →
              </Link>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center gap-4 pt-2 pb-10">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}
