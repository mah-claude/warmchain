import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCode } from '@/lib/notion'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const redirectBase = 'https://warmchain.co/settings/integrations'

  if (error) {
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectBase}?error=missing_params`)
  }

  // ── CSRF nonce validation ────────────────────────────────────────────────
  // The connect route stores a nonce in an httpOnly cookie and embeds it in
  // state as "<base64url(userId)>|<nonce>". We verify the nonce matches the
  // cookie to prevent an attacker from crafting a callback URL with a
  // victim's userId and connecting their own Notion account to the victim.
  const cookieNonce = req.cookies.get('notion_oauth_nonce')?.value
  if (!cookieNonce) {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`)
  }

  // Parse state: "<base64url(userId)>|<nonce>"
  const pipeIdx = state.indexOf('|')
  if (pipeIdx < 0) {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`)
  }
  const encodedUserId = state.slice(0, pipeIdx)
  const stateNonce = state.slice(pipeIdx + 1)

  // Constant-time comparison to prevent timing attacks
  if (!stateNonce || stateNonce !== cookieNonce) {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`)
  }

  // Decode userId
  let userId: string
  try {
    userId = Buffer.from(encodedUserId, 'base64url').toString()
    if (!userId || userId.length < 10) throw new Error('invalid')
  } catch {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Verify user exists in our database
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
  if (!user) {
    return NextResponse.redirect(`${redirectBase}?error=user_not_found`)
  }

  try {
    const tokenData = await exchangeCode(code)

    // Upsert notion connection
    const { error: dbErr } = await supabase.from('notion_connections').upsert({
      user_id: userId,
      access_token: tokenData.access_token,
      workspace_id: tokenData.workspace_id,
      workspace_name: tokenData.workspace_name ?? null,
      workspace_icon: tokenData.workspace_icon ?? null,
      bot_id: tokenData.bot_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (dbErr) {
      console.error('Notion connect DB error:', dbErr)
      return NextResponse.redirect(`${redirectBase}?error=db_error`)
    }

    // Clear the nonce cookie after successful use (one-time use)
    const successResponse = NextResponse.redirect(`${redirectBase}?connected=1`)
    successResponse.cookies.set('notion_oauth_nonce', '', { maxAge: 0, path: '/' })
    return successResponse
  } catch (err) {
    console.error('Notion callback error:', err)
    return NextResponse.redirect(`${redirectBase}?error=exchange_failed`)
  }
}
