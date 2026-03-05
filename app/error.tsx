'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⚡</div>
        <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          We hit an unexpected error. It&apos;s on us — try again or go back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all"
          >
            Try again
          </button>
          <Link href="/" className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all text-center">
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-gray-600 font-mono">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
