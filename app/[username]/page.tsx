'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-xl text-gray-600">Profile not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-3">{profile.company_name}</h1>
              <p className="text-2xl text-gray-600 leading-relaxed">{profile.one_liner}</p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              {profile.stage}
            </span>
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              Startup Profile
            </span>
          </div>
        </div>

        {/* TL;DR Card */}
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">⚡</div>
            <h2 className="text-3xl font-bold text-gray-900">TL;DR</h2>
          </div>
          
          <div className="space-y-6">
            {/* Traction */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Traction</h3>
              <ul className="space-y-2">
                {profile.traction.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-600 text-xl mt-0.5">✓</span>
                    <span className="text-gray-700 text-lg leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* The Ask - Most Important */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-2xl p-10 mb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">🎯</div>
            <h2 className="text-3xl font-bold">The Ask</h2>
          </div>
          <p className="text-xl leading-relaxed font-medium">
            {profile.ask}
          </p>
        </div>

        {/* Team Section */}
        {profile.team && (
          <div className="bg-white rounded-2xl shadow-xl p-10 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">👥</div>
              <h2 className="text-3xl font-bold text-gray-900">Team</h2>
            </div>
            <div className="text-gray-700 text-lg leading-relaxed space-y-2">
              {profile.team.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links Section */}
        {profile.links && (
          <div className="bg-white rounded-2xl shadow-xl p-10 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🔗</div>
              <h2 className="text-3xl font-bold text-gray-900">Links</h2>
            </div>
            <div className="space-y-3">
              {profile.links.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => (
                <div key={i} className="text-lg">
                  <a 
                    href={line.includes('http') ? line.split(' ').find((word: string) => word.includes('http')) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 hover:underline font-medium"
                  >
                    {line}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500 mb-2">Powered by</p>
          <a href="/" className="text-2xl font-bold text-gray-900 hover:text-green-600 transition-colors">
            Warmchain
          </a>
        </div>
      </div>
    </div>
  )
}