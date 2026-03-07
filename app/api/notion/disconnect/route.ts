import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Mark all snapshots as not current (hides from public via RLS)
  await supabase
    .from('notion_snapshots')
    .update({ is_current: false })
    .eq('user_id', user.id)

  // Remove public visibility — no snapshots should show on profile after disconnect
  await supabase
    .from('profiles')
    .update({ notion_enabled: false })
    .eq('user_id', user.id)

  // Delete connection (token revoked on Notion's side automatically after 30 days of disuse)
  await supabase
    .from('notion_connections')
    .delete()
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
