'use client'

import Link from 'next/link'

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Forgot password?</h1>
        <p className="text-gray-400 mb-8">
          Password reset is not implemented yet. Contact{' '}
          <a href="mailto:hello@warmchain.com" className="text-emerald-400 hover:text-emerald-300">
            hello@warmchain.com
          </a>{' '}
          for help.
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
