'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { STAGES, NEEDS_OPTIONS } from '@/lib/types'

const STEPS = [
  { number: 1, label: 'Identity' },
  { number: 2, label: 'Progress' },
  { number: 3, label: 'The Ask' },
]

export default function Builder() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
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
    github_repo: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        // Prefill form for editing
        setIsEditing(true)
        setFormData({
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
          github_repo: data.github_repo ?? '',
        })
      }
    }
    check()
  }, [router])

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const toggleNeed = (value: string) => {
    setFormData(prev => ({
      ...prev,
      needs: prev.needs.includes(value)
        ? prev.needs.filter(n => n !== value)
        : [...prev.needs, value],
    }))
  }

  const filled = Object.entries(formData).filter(([k, v]) =>
    k !== 'needs' ? (v as string).trim() : (v as string[]).length > 0
  ).length
  const progress = Math.round((filled / Object.keys(formData).length) * 100)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.stage) { setError('Please select a stage'); return }
    if (formData.needs.length === 0) { setError('Please select at least one need'); return }
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const profileData = {
        user_id: user.id,
        user_type: 'founder',
        username: formData.username,
        company_name: formData.company_name,
        one_liner: formData.one_liner,
        stage: formData.stage,
        traction: formData.traction,
        mrr: formData.mrr,
        users_count: formData.users_count,
        growth: formData.growth,
        needs: formData.needs.join(','),
        ask: formData.ask,
        team: formData.team,
        links: formData.links,
        github_repo: formData.github_repo || null,
      }
      const { error: err } = isEditing
        ? await supabase.from('profiles').update(profileData).eq('user_id', user.id)
        : await supabase.from('profiles').insert([profileData])
      if (err) throw err
      router.push(`/f/${formData.username}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (focused: boolean) =>
    `w-full px-5 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200 ${focused ? 'border-emerald-500 shadow-[0_0_16px_rgba(52,211,153,0.2)]' : 'border-white/10 hover:border-white/20'}`

  const [focused, setFocused] = useState('')

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <span className="text-sm text-emerald-400 font-medium">{progress}% complete</span>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">{isEditing ? 'Edit your startup profile' : 'Build your startup profile'}</h1>
          <p className="text-gray-400">{isEditing ? 'Update your details below.' : 'Fill in the details connectors need to say yes in 30 seconds.'}</p>
        </div>

        {/* Step tabs */}
        <div className="flex gap-2 mb-10">
          {STEPS.map(s => (
            <button
              key={s.number}
              type="button"
              onClick={() => setStep(s.number)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${step === s.number ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === s.number ? 'bg-emerald-500 text-black' : 'bg-white/10'}`}>{s.number}</span>
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username <span className="text-emerald-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">warmchain.co/</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => !isEditing && set('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    onFocus={() => setFocused('username')} onBlur={() => setFocused('')}
                    required placeholder="yourcompany"
                    readOnly={isEditing}
                    className={`${inputCls(focused === 'username')} pl-40 font-mono ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    maxLength={30}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name <span className="text-emerald-400">*</span></label>
                <input type="text" value={formData.company_name} onChange={e => set('company_name', e.target.value)}
                  onFocus={() => setFocused('company_name')} onBlur={() => setFocused('')}
                  required placeholder="Acme Inc." className={inputCls(focused === 'company_name')} maxLength={60} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">One-liner <span className="text-emerald-400">*</span></label>
                <input type="text" value={formData.one_liner} onChange={e => set('one_liner', e.target.value)}
                  onFocus={() => setFocused('one_liner')} onBlur={() => setFocused('')}
                  required placeholder="B2B SaaS that automates X for Y" className={inputCls(focused === 'one_liner')} maxLength={120} />
                <p className="text-xs text-gray-500 mt-1">What does your company do? One clear sentence.</p>
              </div>
            </div>
          )}

          {/* Step 2: Progress & Metrics */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stage <span className="text-emerald-400">*</span></label>
                <select
                  value={formData.stage}
                  onChange={e => set('stage', e.target.value)}
                  onFocus={() => setFocused('stage')} onBlur={() => setFocused('')}
                  required
                  className={`${inputCls(focused === 'stage')} appearance-none cursor-pointer`}
                >
                  <option value="" disabled className="bg-zinc-900">Select stage…</option>
                  {STAGES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Traction <span className="text-emerald-400">*</span></label>
                <textarea value={formData.traction} onChange={e => set('traction', e.target.value)}
                  onFocus={() => setFocused('traction')} onBlur={() => setFocused('')}
                  required rows={3} placeholder="50 beta users, $10k MRR, growing 20% MoM"
                  className={`${inputCls(focused === 'traction')} resize-none`} maxLength={300} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">MRR</label>
                  <input type="text" value={formData.mrr} onChange={e => set('mrr', e.target.value)}
                    onFocus={() => setFocused('mrr')} onBlur={() => setFocused('')}
                    placeholder="$12k" className={inputCls(focused === 'mrr')} maxLength={30} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Users</label>
                  <input type="text" value={formData.users_count} onChange={e => set('users_count', e.target.value)}
                    onFocus={() => setFocused('users_count')} onBlur={() => setFocused('')}
                    placeholder="250" className={inputCls(focused === 'users_count')} maxLength={30} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Growth</label>
                  <input type="text" value={formData.growth} onChange={e => set('growth', e.target.value)}
                    onFocus={() => setFocused('growth')} onBlur={() => setFocused('')}
                    placeholder="20% MoM" className={inputCls(focused === 'growth')} maxLength={30} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Ask */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">What do you need? <span className="text-emerald-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {NEEDS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleNeed(opt.value)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${formData.needs.includes(opt.value) ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20'}`}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Describe your ask <span className="text-emerald-400">*</span></label>
                <textarea value={formData.ask} onChange={e => set('ask', e.target.value)}
                  onFocus={() => setFocused('ask')} onBlur={() => setFocused('')}
                  required rows={4} placeholder="Raising $1.5M pre-seed. Looking for angels who invest in B2B SaaS at pre-seed."
                  className={`${inputCls(focused === 'ask')} resize-none`} maxLength={400} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Team</label>
                <textarea value={formData.team} onChange={e => set('team', e.target.value)}
                  onFocus={() => setFocused('team')} onBlur={() => setFocused('')}
                  rows={3} placeholder="2 founders — ex-Stripe engineer, ex-BCG consultant"
                  className={`${inputCls(focused === 'team')} resize-none`} maxLength={300} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Links</label>
                <input type="text" value={formData.links} onChange={e => set('links', e.target.value)}
                  onFocus={() => setFocused('links')} onBlur={() => setFocused('')}
                  placeholder="https://yoursite.com, https://twitter.com/you"
                  className={inputCls(focused === 'links')} maxLength={300} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">GitHub Repo</label>
                <input type="text" value={formData.github_repo} onChange={e => set('github_repo', e.target.value)}
                  onFocus={() => setFocused('github_repo')} onBlur={() => setFocused('')}
                  placeholder="owner/repo-name"
                  className={inputCls(focused === 'github_repo')} maxLength={100} />
                <p className="text-xs text-gray-500 mt-1">Optional. Shows recent commits on your dashboard.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all">
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => setStep(s => s + 1)}
                className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all">
                Continue →
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50">
                {loading ? (isEditing ? 'Saving…' : 'Creating profile…') : (isEditing ? 'Save Changes' : 'Create Profile ✨')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
