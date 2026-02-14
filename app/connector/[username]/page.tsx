'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AIChat from '@/components/AIChat'

type ConnectorProfile = {
  username: string
  name: string
  bio: string
  expertise: string
  helps_with: string
  portfolio: string | null
  links: string | null
}

export default function ConnectorPublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [profile, setProfile] = useState<ConnectorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('connector_profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (data) setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [username])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="relative z-10 text-center max-w-md px-6">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-4xl font-bold mb-4">Connector not found</h1>
          <p className="text-gray-400 mb-8">
            The connector profile <span className="text-white font-mono">/connector/{username}</span> doesn't exist.
          </p>
          <Link 
            href="/"
            className="inline-block px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all duration-300"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  const linksArray = profile.links 
    ? profile.links.split(',').map(link => link.trim()).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] orb-chaos-1"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] orb-chaos-2"></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] orb-chaos-3"></div>

      <nav className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold tracking-tight hover:text-emerald-400 transition-colors">
            Warmchain
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={copyLink}
              className="group flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Share
                </>
              )}
            </button>
            <Link 
              href="/signup"
              className="px-5 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-100 transition-all duration-300"
            >
              Join Warmchain
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="mb-16 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-400">
              Connector Profile
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-4 leading-tight tracking-tight">
            {profile.name}
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-400 leading-relaxed font-light">
            {profile.bio}
          </p>
        </div>

        <section className="mb-16 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.03] transition-all duration-300">
            <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
              Expertise
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Focus Areas</h3>
                <p className="text-lg text-gray-300">{profile.expertise}</p>
              </div>
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">I Help With</h3>
                <p className="text-lg text-gray-300 whitespace-pre-line">{profile.helps_with}</p>
              </div>
            </div>
          </div>
        </section>

        {profile.portfolio && (
          <section className="mb-16 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.03] transition-all duration-300">
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                Track Record
              </h2>
              <div className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                {profile.portfolio}
              </div>
            </div>
          </section>
        )}

        {linksArray.length > 0 && (
          <section className="mb-16 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.03] transition-all duration-300">
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                Connect
              </h2>
              <div className="flex flex-wrap gap-3">
                {linksArray.map((link, i) => (
                  <a
                    key={i}
                    href={link.startsWith('http') ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mt-20 text-center animate-fadeInUp" style={{animationDelay: '0.4s'}}>
          <div className="p-12 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-xl">
            <div className="text-4xl mb-6">📬</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Want to connect?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Send a structured intro request to {profile.name.split(' ')[0]} through Warmchain.
            </p>
            <Link 
              href="/signup"
              className="inline-block px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:scale-105 hover:shadow-[0_0_50px_rgba(52,211,153,0.6)] transition-all duration-300"
            >
              Join as Founder
            </Link>
            <p className="mt-6 text-sm text-gray-500">
              Free during beta • Create your startup profile • Send intro requests
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12 px-6 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="text-xl font-bold mb-4 inline-block hover:text-emerald-400 transition-colors">
            Warmchain
          </Link>
          <p className="text-sm text-gray-500 mb-6">
            Structured warm intros for founders and connectors.
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <a href="mailto:hello@warmchain.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <AIChat />

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
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out both;
        }
        
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