'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Builder() {
  const [username, setUsername] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [oneLiner, setOneLiner] = useState('')
  const [stage, setStage] = useState('Pre-seed')
  const [traction, setTraction] = useState('')
  const [ask, setAsk] = useState('')
  const [team, setTeam] = useState('')
  const [links, setLinks] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Check if user already has a profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single()

      if (existingProfile) {
        // User already has a profile - redirect to it
        router.push(`/${existingProfile.username}`)
      } else {
        // No profile yet - show the form
        setCheckingProfile(false)
      }
    }
    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!userId) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        username: username.toLowerCase().replace(/\s+/g, ''),
        company_name: companyName,
        one_liner: oneLiner,
        stage,
        traction,
        ask,
        team: team || null,
        links: links || null,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/${username.toLowerCase().replace(/\s+/g, '')}`)
    }
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Checking your profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Your Startup Profile</h1>
          <p className="text-xl text-gray-600">Fill out your info and get your shareable link</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-6">
          <div>
            <label className="block text-gray-900 font-bold mb-2 text-lg">
              Username <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Your profile: warmchain.com/<span className="font-semibold text-green-600">{username.toLowerCase().replace(/\s+/g, '') || 'username'}</span>
            </p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="airbnb"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 font-bold mb-2 text-lg">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Airbnb"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 font-bold mb-2 text-lg">
              One-liner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              required
              placeholder="Book unique homes around the world"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 font-bold mb-2 text-lg">
              Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            >
              <option>Pre-seed</option>
              <option>Seed</option>
              <option>Series A</option>
              <option>Series B+</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-900 font-bold mb-2 text-lg">
              Traction <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-3">3 key metrics or achievements (one per line)</p>
            <textarea
              value={traction}
              onChange={(e) => setTraction(e.target.value)}
              required
              rows={5}
              placeholder="10,000 users in 3 months&#10;$50k MRR&#10;Partnership with Microsoft"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 font-bold mb-2 text-lg">
              Your Ask <span className="text-red-500">*</span>
            </label>
            <textarea
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              required
              rows={3}
              placeholder="Raising $500k seed round. Looking for intros to pre-seed/seed investors."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 font-bold mb-2 text-lg">
              Team (optional)
            </label>
            <textarea
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              rows={4}
              placeholder="John Doe - CEO (ex-Google)&#10;Jane Smith - CTO (ex-Facebook)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
          </div>

          <div>
            <label className="block text-gray-900 font-bold mb-2 text-lg">
              Links (optional)
            </label>
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              rows={4}
              placeholder="Deck: https://...&#10;Demo: https://...&#10;Calendly: https://..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 text-xl shadow-lg hover:shadow-xl"
          >
            {loading ? 'Creating Profile...' : 'Create Profile →'}
          </button>
        </form>
      </div>
    </div>
  )
}