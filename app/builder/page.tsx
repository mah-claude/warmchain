'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AIChat from '@/components/AIChat'

export default function Builder() {
  const [formData, setFormData] = useState({
    username: '',
    company_name: '',
    one_liner: '',
    stage: '',
    traction: '',
    ask: '',
    team: '',
    links: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [autoSaved, setAutoSaved] = useState(false)
  const router = useRouter()

  const steps = [
    { number: 1, label: 'Identity', fields: ['username', 'company_name', 'one_liner'] },
    { number: 2, label: 'Progress', fields: ['stage', 'traction'] },
    { number: 3, label: 'Ask & Team', fields: ['ask', 'team', 'links'] }
  ]

  const totalFields = Object.keys(formData).length
  const filledFields = Object.values(formData).filter(v => v.trim()).length
  const progress = (filledFields / totalFields) * 100

  useEffect(() => {
    const checkExistingProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single()
        
        if (profile?.username) {
          router.push(`/${profile.username}`)
        }
      }
    }
    checkExistingProfile()
  }, [router])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setAutoSaved(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
          ...formData
        }])

      if (insertError) throw insertError

      router.push(`/${formData.username}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const getCharLimit = (field: string) => {
    const limits: Record<string, number> = {
      username: 30,
      company_name: 50,
      one_liner: 100,
      stage: 50,
      traction: 200,
      ask: 300,
      team: 200,
      links: 200
    }
    return limits[field] || 500
  }

  const getPlaceholder = (field: string) => {
    const placeholders: Record<string, string> = {
      username: 'yourcompany',
      company_name: 'Warmchain',
      one_liner: 'Link-in-bio for founders to get warm intros',
      stage: 'Pre-seed, building MVP',
      traction: '16 founders validated, shipping in 2 weeks',
      ask: 'Seed round: $500k at $5M cap. Looking for angels who invest in B2B SaaS',
      team: 'Solo founder (ex-Air Force), seeking technical cofounder',
      links: 'https://warmchain.com, https://twitter.com/warmchain'
    }
    return placeholders[field] || ''
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>
      
      {/* Chaotic Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] orb-chaos-1"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] orb-chaos-2"></div>
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] orb-chaos-3"></div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold tracking-tight hover:text-emerald-400 transition-colors">
            Warmchain
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-400">
              {Math.round(progress)}% Complete
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            Create your
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              startup profile
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Fill out 7 fields. Get a shareable link. Start getting better warm intros.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-12">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => setCurrentStep(step.number)}
              className={`flex-1 group ${step.number !== steps.length ? 'mr-4' : ''}`}
            >
              <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                currentStep === step.number
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === step.number
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/10 text-gray-500 group-hover:bg-white/20'
                }`}>
                  {step.number}
                </div>
                <span className={`font-medium transition-colors ${
                  currentStep === step.number ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
                }`}>
                  {step.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Identity */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                  Username <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                    warmchain.com/
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={getCharLimit('username')}
                    required
                    className={`w-full pl-48 pr-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 font-mono ${
                      focusedField === 'username'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder={getPlaceholder('username')}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {formData.username.length}/{getCharLimit('username')}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                    focusedField === 'username' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <p className="text-xs text-gray-500">Your unique link. Lowercase, numbers, and hyphens only.</p>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-300">
                  Company Name <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    onFocus={() => setFocusedField('company_name')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={getCharLimit('company_name')}
                    required
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                      focusedField === 'company_name'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder={getPlaceholder('company_name')}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {formData.company_name.length}/{getCharLimit('company_name')}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                    focusedField === 'company_name' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
              </div>

              {/* One-liner */}
              <div className="space-y-2">
                <label htmlFor="one_liner" className="block text-sm font-medium text-gray-300">
                  One-liner <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="one_liner"
                    type="text"
                    value={formData.one_liner}
                    onChange={(e) => handleChange('one_liner', e.target.value)}
                    onFocus={() => setFocusedField('one_liner')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={getCharLimit('one_liner')}
                    required
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                      focusedField === 'one_liner'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder={getPlaceholder('one_liner')}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {formData.one_liner.length}/{getCharLimit('one_liner')}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                    focusedField === 'one_liner' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <p className="text-xs text-gray-500">What does your company do? Keep it clear and concise.</p>
              </div>
            </div>
          )}

          {/* Step 2: Progress */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Stage */}
              <div className="space-y-2">
                <label htmlFor="stage" className="block text-sm font-medium text-gray-300">
                  Stage <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="stage"
                    type="text"
                    value={formData.stage}
                    onChange={(e) => handleChange('stage', e.target.value)}
                    onFocus={() => setFocusedField('stage')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={getCharLimit('stage')}
                    required
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                      focusedField === 'stage'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder={getPlaceholder('stage')}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {formData.stage.length}/{getCharLimit('stage')}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                    focusedField === 'stage' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <p className="text-xs text-gray-500">Pre-seed? Seed? Series A? Or just building?</p>
              </div>

              {/* Traction */}
              <div className="space-y-2">
                <label htmlFor="traction" className="block text-sm font-medium text-gray-300">
                  Traction <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="traction"
                    value={formData.traction}
                    onChange={(e) => handleChange('traction', e.target.value)}
                    onFocus={() => setFocusedField('traction')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={getCharLimit('traction')}
                    required
                    rows={4}
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 resize-none ${
                      focusedField === 'traction'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder={getPlaceholder('traction')}
                  />
                  <div className="absolute right-6 bottom-4 text-xs text-gray-500">
                    {formData.traction.length}/{getCharLimit('traction')}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                    focusedField === 'traction' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <p className="text-xs text-gray-500">Users? Revenue? Validation? What have you built so far?</p>
              </div>
            </div>
          )}

          {/* Step 3: Ask & Team */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Ask */}
              <div className="space-y-2">
                <label htmlFor="ask" className="block text-sm font-medium text-gray-300">
                  The Ask <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="ask"
                    value={formData.ask}
                    onChange={(e) => handleChange('ask', e.target.value)}
                    onFocus={() => setFocusedField('ask')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={getCharLimit('ask')}
                    required
                    rows={5}
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 resize-none ${
                      focusedField === 'ask'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder={getPlaceholder('ask')}
                  />
                  <div className="absolute right-6 bottom-4 text-xs text-gray-500">
                    {formData.ask.length}/{getCharLimit('ask')}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                    focusedField === 'ask' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <p className="text-xs text-gray-500">What do you need? Funding? Cofounder? Customers? Be specific.</p>
              </div>

              {/* Team */}
              <div className="space-y-2">
                <label htmlFor="team" className="block text-sm font-medium text-gray-300">
                  Team
                </label>
                <div className="relative">
                  <textarea
                    id="team"
                    value={formData.team}
                    onChange={(e) => handleChange('team', e.target.value)}
                    onFocus={() => setFocusedField('team')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={getCharLimit('team')}
                    rows={3}
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 resize-none ${
                      focusedField === 'team'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder={getPlaceholder('team')}
                  />
                  <div className="absolute right-6 bottom-4 text-xs text-gray-500">
                    {formData.team.length}/{getCharLimit('team')}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                    focusedField === 'team' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <p className="text-xs text-gray-500">Who's building this? Backgrounds, roles, why this team wins.</p>
              </div>

              {/* Links */}
              <div className="space-y-2">
                <label htmlFor="links" className="block text-sm font-medium text-gray-300">
                  Links
                </label>
                <div className="relative">
                  <textarea
                    id="links"
                    value={formData.links}
                    onChange={(e) => handleChange('links', e.target.value)}
                    onFocus={() => setFocusedField('links')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={getCharLimit('links')}
                    rows={3}
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 resize-none ${
                      focusedField === 'links'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.01]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder={getPlaceholder('links')}
                  />
                  <div className="absolute right-6 bottom-4 text-xs text-gray-500">
                    {formData.links.length}/{getCharLimit('links')}
                  </div>
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                    focusedField === 'links' ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
                <p className="text-xs text-gray-500">Website, Twitter, LinkedIn, GitHub, etc.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl animate-shake">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-8 py-4 border border-white/20 text-white font-medium rounded-2xl hover:bg-white/5 transition-all duration-300"
              >
                ← Previous
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1 group relative px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Next Step
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 group relative px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating profile...
                    </>
                  ) : (
                    <>
                      Create Profile ✨
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* AI Chat */}
      <AIChat />

      {/* Animations */}
      <style jsx>{`
        @keyframes orbChaos1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          15% { transform: translate(-80px, 120px) scale(1.2); }
          30% { transform: translate(150px, -60px) scale(0.9); }
          45% { transform: translate(-120px, -100px) scale(1.1); }
          60% { transform: translate(100px, 140px) scale(0.85); }
          75% { transform: translate(-90px, 40px) scale(1.15); }
        }
        
        @keyframes orbChaos2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(130px, -110px) scale(1.1); }
          40% { transform: translate(-100px, 90px) scale(0.95); }
          60% { transform: translate(110px, 130px) scale(1.2); }
          80% { transform: translate(-140px, -80px) scale(0.9); }
        }
        
        @keyframes orbChaos3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-110px, -130px) scale(1.15); }
          50% { transform: translate(140px, 100px) scale(0.85); }
          75% { transform: translate(-70px, 120px) scale(1.05); }
        }
        
        .orb-chaos-1 { animation: orbChaos1 18s ease-in-out infinite; }
        .orb-chaos-2 { animation: orbChaos2 22s ease-in-out infinite; }
        .orb-chaos-3 { animation: orbChaos3 25s ease-in-out infinite; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        
        @media (prefers-reduced-motion: reduce) {
          .orb-chaos-1, .orb-chaos-2, .orb-chaos-3 {
            animation: none !important;
          }
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}