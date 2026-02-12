'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-gray-900">Warmchain</div>
        <Link 
          href="/login"
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Log in
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Package your startup<br />in 10 minutes
        </h1>
        
        <p className="text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
          One shareable link. Structured intro requests. Get warm intros that actually work.
        </p>
        
        <Link 
          href="/signup"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-5 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          Create Your Profile →
        </Link>

        <p className="mt-6 text-gray-500">Free • 10 minutes • No credit card</p>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-bold mb-2">Package once</h3>
            <p className="text-gray-600">One clean page. No more sending decks, docs, or long explanations.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold mb-2">Share everywhere</h3>
            <p className="text-gray-600">One link for all intro requests. Connectors decide in 30 seconds.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-2">Get intros</h3>
            <p className="text-gray-600">Structured asks. Clear context. Warm intros that close.</p>
          </div>
        </div>
      </div>
    </div>
  )
}