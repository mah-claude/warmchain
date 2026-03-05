'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AIChat from '@/components/AIChat'

function useRateLimit(maxAttempts = 5, windowMs = 60000) {
  const [attempts, setAttempts] = useState<number[]>([])
  const isLimited = attempts.filter(t => Date.now() - t < windowMs).length >= maxAttempts
  const recordAttempt = () => setAttempts(prev => [...prev.filter(t => Date.now() - t < windowMs), Date.now()])
  const waitSeconds = isLimited ? Math.ceil((Math.min(...attempts) + windowMs - Date.now()) / 1000) : 0
  return { isLimited, recordAttempt, waitSeconds }
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { isLimited, recordAttempt, waitSeconds } = useRateLimit()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isLimited) { setError(`Too many attempts. Please wait ${waitSeconds}s before trying again.`); return }
    setError('')
    setLoading(true)
    recordAttempt()

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      const { data: { user } } = await supabase.auth.getUser()
      if (user) router.push(next)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
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
        <div className="hidden lg:flex lg:w-1/2 relative">
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <Link href="/" className="text-2xl font-bold tracking-tight hover:text-emerald-400 transition-colors">
              Warmchain
            </Link>

            <div className="space-y-8">
              <div>
                <h1 className="text-5xl font-bold mb-6 leading-tight">
                  Welcome back to
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                    Warmchain
                  </span>
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed max-w-md">
                  Continue building better warm intro workflows.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: '50+', label: 'Active founders' },
                  { number: '200+', label: 'Profiles created' },
                  { number: '< 10min', label: 'Setup time' },
                  { number: '30sec', label: 'Decision time' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-all duration-300"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both`,
                    }}
                  >
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
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
            <Link href="/" className="lg:hidden block text-2xl font-bold mb-8 hover:text-emerald-400 transition-colors">
              Warmchain
            </Link>

            {/* Header */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold mb-3">Welcome back</h2>
              <p className="text-gray-400">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                  Sign up
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
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
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
            </form>
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <AIChat />

      {/* Animations */}
      <style jsx>{`
        @keyframes orbChaos1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          15% {
            transform: translate(-80px, 120px) scale(1.2);
          }
          30% {
            transform: translate(150px, -60px) scale(0.9);
          }
          45% {
            transform: translate(-120px, -100px) scale(1.1);
          }
          60% {
            transform: translate(100px, 140px) scale(0.85);
          }
          75% {
            transform: translate(-90px, 40px) scale(1.15);
          }
        }

        @keyframes orbChaos2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          20% {
            transform: translate(130px, -110px) scale(1.1);
          }
          40% {
            transform: translate(-100px, 90px) scale(0.95);
          }
          60% {
            transform: translate(110px, 130px) scale(1.2);
          }
          80% {
            transform: translate(-140px, -80px) scale(0.9);
          }
        }

        @keyframes orbChaos3 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-110px, -130px) scale(1.15);
          }
          50% {
            transform: translate(140px, 100px) scale(0.85);
          }
          75% {
            transform: translate(-70px, 120px) scale(1.05);
          }
        }

        .orb-chaos-1 {
          animation: orbChaos1 18s ease-in-out infinite;
        }
        .orb-chaos-2 {
          animation: orbChaos2 22s ease-in-out infinite;
        }
        .orb-chaos-3 {
          animation: orbChaos3 25s ease-in-out infinite;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        /* Wandering blinking orb */
        @keyframes wander {
          0% {
            transform: translate(8vw, 18vh);
          }
          20% {
            transform: translate(78vw, 12vh);
          }
          45% {
            transform: translate(62vw, 82vh);
          }
          70% {
            transform: translate(18vw, 72vh);
          }
          100% {
            transform: translate(8vw, 18vh);
          }
        }

        @keyframes slowBlink {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        .wandering-orb {
          position: absolute;
          top: 0;
          left: 0;
          animation: wander 42s ease-in-out infinite;
          will-change: transform;
        }

        .orb-pulse {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: rgba(52, 211, 153, 0.95);
          box-shadow: 0 0 22px rgba(52, 211, 153, 0.9), 0 0 70px rgba(52, 211, 153, 0.35);
          animation: slowBlink 6s ease-in-out infinite;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .orb-chaos-1,
          .orb-chaos-2,
          .orb-chaos-3,
          .wandering-orb,
          .orb-pulse {
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

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
