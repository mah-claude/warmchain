'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/types'
import AIChat from '@/components/AIChat'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0
    if (pass.length >= 8) strength += 25
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength += 25
    if (pass.match(/[0-9]/)) strength += 25
    if (pass.match(/[^a-zA-Z0-9]/)) strength += 25
    return strength
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordStrength(calculatePasswordStrength(value))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      router.push('/builder')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Unified background across BOTH columns (no seam) */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/15 via-black to-black" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50" />

      {/* Chaotic floating orbs (whole screen) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] orb-chaos-1" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[120px] orb-chaos-2" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-500/15 rounded-full blur-[100px] orb-chaos-3" />

      {/* Wandering blinking dot (whole screen) */}
      <div className="absolute inset-0 pointer-events-none z-[2]">
        <div className="wandering-orb">
          <div className="orb-pulse" />
        </div>
      </div>

      {/* Layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight hover:text-emerald-400 transition-colors"
            >
              Warmchain
            </Link>

            <div className="space-y-8">
              <div>
                <h1 className="text-5xl font-bold mb-6 leading-tight">
                  Package your startup.
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                    Get warm intros.
                  </span>
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed max-w-md">
                  Join founders who are getting better warm intros with one shareable link.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                {[
                  { icon: '⚡', text: 'Create your profile in 10 minutes' },
                  { icon: '🎯', text: 'Share one link for every intro request' },
                  { icon: '🔒', text: 'Private by default, you control access' },
                  { icon: '✨', text: 'Free during beta, no credit card' },
                ].map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-all duration-300 group"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both`,
                    }}
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform">
                      {benefit.icon}
                    </div>
                    <p className="text-gray-300">{benefit.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-500">© 2026 Warmchain. Built for founders, by founders.</div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center p-8 pt-24 lg:pt-0 relative">
          <div className="w-full max-w-md relative z-10">
            {/* Mobile logo */}
            <Link
              href="/"
              className="lg:hidden block text-2xl font-bold mb-8 hover:text-emerald-400 transition-colors"
            >
              Warmchain
            </Link>

            {/* Header */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-3">Create account</h2>
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                      focusedField === 'email'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.02]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder="you@example.com"
                  />
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                      focusedField === 'email' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={`w-full px-6 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 ${
                      focusedField === 'password'
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.02]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    placeholder="••••••••"
                  />
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 -z-10 blur-xl transition-opacity duration-300 ${
                      focusedField === 'password' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[25, 50, 75, 100].map((threshold) => (
                        <div
                          key={threshold}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= threshold
                              ? passwordStrength === 100
                                ? 'bg-emerald-500'
                                : passwordStrength >= 75
                                ? 'bg-green-500'
                                : passwordStrength >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {passwordStrength === 100
                        ? '💪 Strong password'
                        : passwordStrength >= 75
                        ? '👍 Good password'
                        : passwordStrength >= 50
                        ? '👌 Fair password'
                        : '⚠️ Weak password'}
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl animate-shake">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <AIChat />
    </div>
  )
}
