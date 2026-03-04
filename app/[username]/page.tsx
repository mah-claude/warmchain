'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FounderProfileRedirect({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/f/${username}`)
  }, [username, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
