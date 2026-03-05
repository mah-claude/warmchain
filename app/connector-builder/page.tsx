'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { EXPERTISE_OPTIONS, HELPS_WITH_OPTIONS } from '@/lib/types'

const STEPS = [
  { number: 1, label: 'Identity' },
  { number: 2, label: 'Expertise' },
  { number: 3, label: 'Track Record' },
]

export default function ConnectorBuilder() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    bio: '',
    expertise: [] as string[],    // stored as comma-separated
    helps_with: [] as string[],   // stored as comma-separated
    portfolio: '',
    links: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('connector_profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        // Prefill form for editing
        setIsEditing(true)
        setFormData({
          username: data.username ?? '',
          name: data.name ?? '',
          bio: data.bio ?? '',
          expertise: data.expertise ? data.expertise.split(',').filter(Boolean) : [],
          helps_with: data.helps_with ? data.helps_with.split(',').filter(Boolean) : [],
          portfolio: data.portfolio ?? '',
          links: data.links ?? '',
        })
      }
    }
    check()
  }, [router])

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const toggle = (field: 'expertise' | 'helps_with', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v: string) => v !== value)
        : [...prev[field], value],
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formData.expertise.length === 0) { setError('Please select at least one expertise area'); return }
    if (formData.helps_with.length === 0) { setError('Please select what you help with'); return }
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const profileData = {
        user_id: user.id,
        user_type: 'connector',
        username: formData.username,
        name: formData.name,
        bio: formData.bio,
        expertise: formData.expertise.join(','),
        helps_with: formData.helps_with.join(','),
        portfolio: formData.portfolio,
        links: formData.links,
      }
      const { error: err } = isEditing
        ? await supabase.from('connector_profiles').update(profileData).eq('user_id', user.id)
        : await supabase.from('connector_profiles').insert([profileData])
      if (err) throw err
      router.push(`/c/${formData.username}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (f: boolean) =>
    `w-full px-5 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all duration-200 ${f ? 'border-emerald-500 shadow-[0_0_16px_rgba(52,211,153,0.2)]' : 'border-white/10 hover:border-white/20'}`

  const filled = [formData.username, formData.name, formData.bio, formData.portfolio].filter(v => v.trim()).length
    + (formData.expertise.length > 0 ? 1 : 0)
    + (formData.helps_with.length > 0 ? 1 : 0)
  const progress = Math.round((filled / 6) * 100)

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold hover:text-emerald-400 transition-colors">Warmchain</Link>
          <span className="text-sm text-emerald-400 font-medium">{progress}% complete</span>
        </div>
      </nav>
      <div className="h-1 bg-white/5">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">{isEditing ? 'Edit your connector profile' : 'Build your connector profile'}</h1>
          <p className="text-gray-400">{isEditing ? 'Update your details below.' : 'Help founders succeed with structured intro requests.'}</p>
        </div>

        <div className="flex gap-2 mb-10">
          {STEPS.map(s => (
            <button key={s.number} onClick={() => setStep(s.number)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${step === s.number ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === s.number ? 'bg-emerald-500 text-black' : 'bg-white/10'}`}>{s.number}</span>
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username <span className="text-emerald-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">warmchain.com/connector/</span>
                  <input type="text" value={formData.username}
                    onChange={e => !isEditing && set('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    onFocus={() => setFocused('username')} onBlur={() => setFocused('')}
                    required placeholder="sarahchen"
                    readOnly={isEditing}
                    className={`${inputCls(focused === 'username')} pl-60 font-mono ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`} maxLength={30} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name <span className="text-emerald-400">*</span></label>
                <input type="text" value={formData.name} onChange={e => set('name', e.target.value)}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                  required placeholder="Sarah Chen" className={inputCls(focused === 'name')} maxLength={60} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio <span className="text-emerald-400">*</span></label>
                <textarea value={formData.bio} onChange={e => set('bio', e.target.value)}
                  onFocus={() => setFocused('bio')} onBlur={() => setFocused('')}
                  required rows={3} placeholder="Angel investor, ex-VP Product at Stripe. I help early-stage B2B SaaS founders."
                  className={`${inputCls(focused === 'bio')} resize-none`} maxLength={300} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Expertise Areas <span className="text-emerald-400">*</span></label>
                <p className="text-xs text-gray-500 mb-4">What industries/sectors do you focus on?</p>
                <div className="grid grid-cols-3 gap-3">
                  {EXPERTISE_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => toggle('expertise', opt.value)}
                      className={`p-4 rounded-xl border text-center transition-all duration-200 ${formData.expertise.includes(opt.value) ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20'}`}>
                      <span className="font-medium text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">I Help With <span className="text-emerald-400">*</span></label>
                <p className="text-xs text-gray-500 mb-4">What kinds of introductions or help can you provide?</p>
                <div className="grid grid-cols-2 gap-3">
                  {HELPS_WITH_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => toggle('helps_with', opt.value)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${formData.helps_with.includes(opt.value) ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20'}`}>
                      <span className="font-medium text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Track Record</label>
                <textarea value={formData.portfolio} onChange={e => set('portfolio', e.target.value)}
                  onFocus={() => setFocused('portfolio')} onBlur={() => setFocused('')}
                  rows={5} placeholder="Helped 15+ founders raise seed rounds. Portfolio includes Acme ($2M seed), DevFlow ($1.5M seed)."
                  className={`${inputCls(focused === 'portfolio')} resize-none`} maxLength={500} />
                <p className="text-xs text-gray-500 mt-1">Companies you've helped, successful intros, investments.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Links</label>
                <input type="text" value={formData.links} onChange={e => set('links', e.target.value)}
                  onFocus={() => setFocused('links')} onBlur={() => setFocused('')}
                  placeholder="https://twitter.com/you, https://linkedin.com/in/you"
                  className={inputCls(focused === 'links')} maxLength={300} />
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
                {loading ? (isEditing ? 'Saving…' : 'Creating profile…') : (isEditing ? 'Save Changes' : 'Create Connector Profile ✨')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
