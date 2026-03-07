'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { STAGES, NEEDS_OPTIONS } from '@/lib/types'

const TOTAL_STEPS = 3

const STEP_META = [
  { heading: 'Tell us about your startup', sub: 'This is how connectors will find you.' },
  { heading: 'What does growth look like?', sub: 'Numbers speak louder than words.' },
  { heading: 'What do you need?', sub: 'Be specific — it gets you better intros.' },
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
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [focused, setFocused] = useState('')
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      // Profile already exists → go to edit settings, not the creation wizard
      const { data } = await supabase.from('profiles').select('username').eq('user_id', user.id).single()
      if (data) { router.replace('/settings/profile'); return }
      setCheckingAuth(false)
    }
    check()
  }, [router])

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const toggleNeed = (value: string) =>
    setFormData(prev => ({
      ...prev,
      needs: prev.needs.includes(value)
        ? prev.needs.filter(n => n !== value)
        : [...prev.needs, value],
    }))

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!formData.username) { setError('Username is required'); return false }
      if (!formData.company_name) { setError('Company name is required'); return false }
      if (!formData.one_liner) { setError('One-liner is required'); return false }
    }
    if (step === 2) {
      if (!formData.stage) { setError('Select your stage'); return false }
      if (!formData.traction) { setError('Describe your traction'); return false }
    }
    if (step === 3) {
      if (formData.needs.length === 0) { setError('Select at least one need'); return false }
      if (!formData.ask) { setError('Describe your ask'); return false }
    }
    return true
  }

  const handleContinue = () => {
    setError('')
    if (validateStep()) setStep(s => s + 1)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateStep()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: err } = await supabase.from('profiles').insert([{
        user_id: user.id,
        user_type: 'founder',
        username: formData.username,
        company_name: formData.company_name,
        one_liner: formData.one_liner,
        stage: formData.stage,
        traction: formData.traction,
        mrr: formData.mrr || null,
        users_count: formData.users_count || null,
        growth: formData.growth || null,
        needs: formData.needs.join(','),
        ask: formData.ask,
        team: formData.team || null,
        links: formData.links || null,
      }])
      if (err) throw err
      router.push(`/builder/integrations?username=${encodeURIComponent(formData.username)}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inp = (active: boolean) =>
    `w-full px-5 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200 ${
      active ? 'border-emerald-500 shadow-[0_0_16px_rgba(52,211,153,0.15)]' : 'border-white/10 hover:border-white/20'
    }`

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const meta = STEP_META[step - 1]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 pt-8 pb-4">
        <span className="text-lg font-bold tracking-tight">warmchain</span>
        {/* Step dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? 'w-6 h-2 bg-emerald-400'
                  : i + 1 < step
                  ? 'w-2 h-2 bg-emerald-600'
                  : 'w-2 h-2 bg-white/15'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500">{step} of {TOTAL_STEPS}</span>
      </header>

      {/* Progress bar */}
      <div className="h-px bg-white/5">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          <div className="mb-10">
            <p className="text-emerald-400 text-sm font-medium mb-2">Step {step}</p>
            <h1 className="text-3xl font-bold mb-1">{meta.heading}</h1>
            <p className="text-gray-400 text-sm">{meta.sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Step 1: Identity ── */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your URL <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono select-none">
                      warmchain.co/
                    </span>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      onFocus={() => setFocused('username')} onBlur={() => setFocused('')}
                      placeholder="yourcompany"
                      className={`${inp(focused === 'username')} pl-[130px] font-mono`}
                      maxLength={30}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">Lowercase letters, numbers and hyphens only. Can&apos;t be changed later.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={e => set('company_name', e.target.value)}
                    onFocus={() => setFocused('company_name')} onBlur={() => setFocused('')}
                    placeholder="Acme Inc."
                    className={inp(focused === 'company_name')}
                    maxLength={60}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    One-liner <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.one_liner}
                    onChange={e => set('one_liner', e.target.value)}
                    onFocus={() => setFocused('one_liner')} onBlur={() => setFocused('')}
                    placeholder="B2B SaaS that automates X for Y"
                    className={inp(focused === 'one_liner')}
                    maxLength={120}
                  />
                  <p className="text-xs text-gray-600 mt-1.5">What you do, for whom, in one sentence.</p>
                </div>
              </>
            )}

            {/* ── Step 2: Stage & Metrics ── */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stage <span className="text-emerald-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {STAGES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('stage', s)}
                        className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                          formData.stage === s
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Traction <span className="text-emerald-400">*</span>
                  </label>
                  <textarea
                    value={formData.traction}
                    onChange={e => set('traction', e.target.value)}
                    onFocus={() => setFocused('traction')} onBlur={() => setFocused('')}
                    rows={3}
                    placeholder="50 beta users, $10k MRR, growing 20% MoM"
                    className={`${inp(focused === 'traction')} resize-none`}
                    maxLength={300}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'mrr', label: 'MRR', ph: '$12k' },
                    { key: 'users_count', label: 'Users', ph: '250' },
                    { key: 'growth', label: 'Growth', ph: '20% MoM' },
                  ].map(({ key, label, ph }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-400 mb-2">{label}</label>
                      <input
                        type="text"
                        value={formData[key as keyof typeof formData] as string}
                        onChange={e => set(key, e.target.value)}
                        onFocus={() => setFocused(key)} onBlur={() => setFocused('')}
                        placeholder={ph}
                        className={inp(focused === key)}
                        maxLength={30}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Step 3: The Ask ── */}
            {step === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    What do you need? <span className="text-emerald-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {NEEDS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleNeed(opt.value)}
                        className={`py-3.5 px-4 rounded-xl border text-sm font-medium text-left transition-all duration-200 ${
                          formData.needs.includes(opt.value)
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Describe your ask <span className="text-emerald-400">*</span>
                  </label>
                  <textarea
                    value={formData.ask}
                    onChange={e => set('ask', e.target.value)}
                    onFocus={() => setFocused('ask')} onBlur={() => setFocused('')}
                    rows={4}
                    placeholder="Raising $1.5M pre-seed. Looking for angels who invest in B2B SaaS."
                    className={`${inp(focused === 'ask')} resize-none`}
                    maxLength={400}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Team</label>
                  <textarea
                    value={formData.team}
                    onChange={e => set('team', e.target.value)}
                    onFocus={() => setFocused('team')} onBlur={() => setFocused('')}
                    rows={2}
                    placeholder="2 founders — ex-Stripe engineer, ex-BCG consultant"
                    className={`${inp(focused === 'team')} resize-none`}
                    maxLength={300}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Links</label>
                  <input
                    type="text"
                    value={formData.links}
                    onChange={e => set('links', e.target.value)}
                    onFocus={() => setFocused('links')} onBlur={() => setFocused('')}
                    placeholder="https://yoursite.com, https://twitter.com/you"
                    className={inp(focused === 'links')}
                    maxLength={300}
                  />
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2">
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl text-base hover:bg-emerald-100 transition-all duration-200 active:scale-[0.99]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl text-base hover:bg-emerald-400 transition-all duration-200 disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? 'Creating your profile…' : 'Create profile'}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
