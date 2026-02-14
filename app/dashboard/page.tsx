'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AIChat from '@/components/AIChat'

type FounderProfile = {
  username: string
  company_name: string
  one_liner: string
  user_type: string
}

type ConnectorProfile = {
  username: string
  name: string
  bio: string
  user_type: string
}

export default function Dashboard() {
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null)
  const [connectorProfile, setConnectorProfile] = useState<ConnectorProfile | null>(null)
  const [userType, setUserType] = useState<'founder' | 'connector' | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check founder profile
      const { data: founder } = await supabase
        .from('profiles')
        .select('username, company_name, one_liner, user_type')
        .eq('user_id', user.id)
        .single()

      // Check connector profile
      const { data: connector } = await supabase
        .from('connector_profiles')
        .select('username, name, bio, user_type')
        .eq('user_id', user.id)
        .single()

      if (founder) {
        setFounderProfile(founder)
        setUserType('founder')
      } else if (connector) {
        setConnectorProfile(connector)
        setUserType('connector')
      } else {
        // No profile - redirect to appropriate builder
        router.push('/builder')
      }
      
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!founderProfile && !connectorProfile) return null

  // FOUNDER DASHBOARD
  if (userType === 'founder' && founderProfile) {
    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${founderProfile.username}`

    return (
      <div className="min-h-screen bg-black text-white">
        <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-semibold tracking-tight hover:text-emerald-400 transition-colors">
              Warmchain
            </Link>
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400">👔 Founder</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold mb-4">Dashboard</h1>
          <p className="text-xl text-gray-400 mb-12">Welcome back, {founderProfile.company_name}!</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Your Profile Card */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-all">
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
                Your Startup Profile
              </h2>
              <h3 className="text-2xl font-bold mb-2">{founderProfile.company_name}</h3>
              <p className="text-gray-400 mb-6">{founderProfile.one_liner}</p>
              
              <div className="space-y-3">
                <Link
                  href={`/${founderProfile.username}`}
                  className="block w-full px-6 py-3 bg-white text-black font-semibold rounded-2xl text-center hover:scale-105 transition-all"
                >
                  View Public Profile
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profileUrl)
                    alert('Link copied!')
                  }}
                  className="block w-full px-6 py-3 border border-white/20 text-white font-medium rounded-2xl text-center hover:bg-white/5 transition-all"
                >
                  Copy Profile Link
                </button>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-all">
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full px-6 py-3 border border-white/20 text-white font-medium rounded-2xl text-left hover:bg-white/5 transition-all">
                  📝 Edit Profile (Coming Soon)
                </button>
                <button className="w-full px-6 py-3 border border-white/20 text-white font-medium rounded-2xl text-left hover:bg-white/5 transition-all">
                  📊 View Analytics (Coming Soon)
                </button>
                <button className="w-full px-6 py-3 border border-white/20 text-white font-medium rounded-2xl text-left hover:bg-white/5 transition-all">
                  📬 Send Intro Request (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>

        <AIChat />
      </div>
    )
  }

  // CONNECTOR DASHBOARD
  if (userType === 'connector' && connectorProfile) {
    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/connector/${connectorProfile.username}`

    return (
      <div className="min-h-screen bg-black text-white">
        <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-semibold tracking-tight hover:text-emerald-400 transition-colors">
              Warmchain
            </Link>
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400">🤝 Connector</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold mb-4">Connector Dashboard</h1>
          <p className="text-xl text-gray-400 mb-12">Welcome back, {connectorProfile.name}!</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Inbox Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                📬 Intro Requests Inbox
              </h2>
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-400 mb-4">No intro requests yet</p>
                <p className="text-sm text-gray-500">Founders will send you structured intro requests here</p>
              </div>
            </div>

            {/* Your Profile Card */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-all">
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
                Your Connector Profile
              </h2>
              <h3 className="text-2xl font-bold mb-2">{connectorProfile.name}</h3>
              <p className="text-gray-400 mb-6 line-clamp-2">{connectorProfile.bio}</p>
              
              <div className="space-y-3">
                <Link
                  href={`/connector/${connectorProfile.username}`}
                  className="block w-full px-6 py-3 bg-white text-black font-semibold rounded-2xl text-center hover:scale-105 transition-all"
                >
                  View Public Profile
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profileUrl)
                    alert('Link copied!')
                  }}
                  className="block w-full px-6 py-3 border border-white/20 text-white font-medium rounded-2xl text-center hover:bg-white/5 transition-all"
                >
                  Copy Profile Link
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-6">
                Your Impact
              </h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">0</div>
                  <div className="text-sm text-gray-500">Intros Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">0</div>
                  <div className="text-sm text-gray-500">Founders Helped</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">-</div>
                  <div className="text-sm text-gray-500">Response Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AIChat />
      </div>
    )
  }

  return null
}
