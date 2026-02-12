'use client'

import Link from 'next/link'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 py-4 px-6">
        <Link href="/" className="text-xl font-semibold hover:text-emerald-400 transition-colors">
          Warmchain
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 leading-relaxed mb-6">
          We don&apos;t sell your data. Your profile is private by default. Full privacy policy coming soon.
        </p>
        <Link href="/" className="text-emerald-400 hover:text-emerald-300">
          ← Back to home
        </Link>
      </main>
    </div>
  )
}
