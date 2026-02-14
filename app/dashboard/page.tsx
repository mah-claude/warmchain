'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AIChat from '@/components/AIChat'

type Profile = {
  username: string
  company_name: string
  one_liner: string
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
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

      const { data } = await supabase
        .from('profiles')
        .select('username, company_name, one_liner')
        .eq('user_id', user.id)
        .single()

      if (!data) {
        router.push('/builder')
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!profile) return null

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${profile.username}`

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold tracking-tight hover:text-emerald-400 transition-colors">
            Warmchain
          </Link>
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/')
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold mb-4">Dashboard</h1>
        <p className="text-xl text-gray-400 mb-12">Welcome back, {profile.company_name}!</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Your Profile Card */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:bg-white/[0.05] transition-all">
            <h2 className="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-4">
              Your Profile
            </h2>
            <h3 className="text-2xl font-bold mb-2">{profile.company_name}</h3>
            <p className="text-gray-400 mb-6">{profile.one_liner}</p>
            
            <div className="space-y-3">
              <Link
                href={`/${profile.username}`}
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
                Copy Link
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