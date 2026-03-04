'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) throw err
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-xl font-bold mb-10 hover:text-emerald-400 transition-colors">Warmchain</Link>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-3xl font-bold mb-3">Check your email</h1>
            <p className="text-gray-400 mb-6">We sent a password reset link to <strong className="text-white">{email}</strong>.</p>
            <Link href="/login" className="inline-block px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all text-sm">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Reset password</h1>
            <p className="text-gray-400 mb-8">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-6 text-sm text-center text-gray-500">
              Remember your password?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
