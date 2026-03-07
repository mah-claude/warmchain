import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { generateOAuthUrl } from '@/lib/notion'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  if (!process.env.NOTION_CLIENT_ID) {
    return NextResponse.json({ error: 'Notion integration not configured' }, { status: 503 })
  }

  let userId: string | null = null

  // ── Auth: try Bearer token first (fetch-based calls from the SPA) ──────────
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (bearerToken) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: { user } } = await supabase.auth.getUser(bearerToken)
    userId = user?.id ?? null
  }

  // ── Auth: fall back to cookie session (window.location.href navigation) ────
  if (!userId) {
    // createServerClient reads Supabase session cookies set by @supabase/ssr
    const cookieSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {}, // read-only in this context
        },
      },
    )
    const { data: { user } } = await cookieSupabase.auth.getUser()
    userId = user?.id ?? null
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/login?next=/settings/integrations', 'https://warmchain.co'))
  }

  // ── CSRF nonce ─────────────────────────────────────────────────────────────
  // Generate a one-time nonce stored in an httpOnly cookie.
  // State = "<base64url(userId)>|<nonce>" so the callback can verify both
  // the identity and the nonce without requiring another session lookup.
  const nonce = randomUUID()
  const state = `${Buffer.from(userId).toString('base64url')}|${nonce}`
  const url = generateOAuthUrl(state)

  const response = NextResponse.redirect(url)

  response.cookies.set('notion_oauth_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10-minute TTL
    path: '/',
  })

  return response
}
