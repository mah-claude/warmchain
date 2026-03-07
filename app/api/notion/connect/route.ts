import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateOAuthUrl } from '@/lib/notion'

export async function GET(req: Request) {
  if (!process.env.NOTION_CLIENT_ID) {
    return NextResponse.json({ error: 'Notion integration not configured' }, { status: 503 })
  }

  // Verify user is authenticated
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  // Also check cookie-based session via supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let userId: string | null = null

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    userId = user?.id ?? null
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/login?next=/settings/integrations', 'https://warmchain.co'))
  }

  // State = userId (simple CSRF protection for P0)
  const state = Buffer.from(userId).toString('base64url')
  const url = generateOAuthUrl(state)

  return NextResponse.redirect(url)
}
